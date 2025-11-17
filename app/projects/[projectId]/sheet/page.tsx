"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {useParams} from "next/navigation";
import Spreadsheet from "react-spreadsheet";

export default function SpreadsheetPage() {
    const params = useParams();
    const projectId = params.projectId as string;

    const numRows = 50;
    const numCols = 50;

    // Generate empty spreadsheet data
    const generateEmptyData = () => {
        const data = [];
        for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
            const row = [];
            for (let colIndex = 0; colIndex < numCols; colIndex++) {
                row.push({ value: "" });
            }
            data.push(row);
        }
        return data;
    };

    const [data, setData] = useState(generateEmptyData());
    const [selected, setSelected] = useState<any>(null);
    const [clipboard, setClipboard] = useState<any>(null);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
    const [mergedCells, setMergedCells] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const spreadsheetRef = useRef<HTMLDivElement>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load saved spreadsheet data on mount
    useEffect(() => {
        const loadSpreadsheet = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`/api/projects/${projectId}/spreadsheet`);
                if (response.ok) {
                    const result = await response.json();
                    if (result.data && result.data.cells) {
                        setData(result.data.cells);
                    }
                    if (result.data && result.data.mergedCells) {
                        setMergedCells(result.data.mergedCells);
                    }
                }
            } catch (error) {
                console.error("Error loading spreadsheet:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadSpreadsheet();
    }, [projectId]);

    // Auto-save function with debounce
    const saveSpreadsheet = useCallback(async () => {
        try {
            setSaveStatus('saving');
            const response = await fetch(`/api/projects/${projectId}/spreadsheet`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    data: {
                        cells: data,
                        mergedCells: mergedCells,
                    }
                }),
            });

            if (response.ok) {
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } else {
                setSaveStatus('error');
                setTimeout(() => setSaveStatus('idle'), 3000);
            }
        } catch (error) {
            console.error("Error saving spreadsheet:", error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    }, [data, mergedCells, projectId]);

    // Trigger auto-save when data changes
    useEffect(() => {
        if (isLoading) return; // Don't save on initial load

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            saveSpreadsheet();
        }, 2000); // Save 2 seconds after last change

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [data, mergedCells, saveSpreadsheet, isLoading]);

    // Save on blur, visibility change, and beforeunload
    useEffect(() => {
        const saveNow = () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = null;
            }
            void saveSpreadsheet();
        };

        const onVisibility = () => {
            if (document.hidden) saveNow();
        };

        const onBlur = () => saveNow();

        window.addEventListener('blur', onBlur);
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('beforeunload', saveNow);

        return () => {
            window.removeEventListener('blur', onBlur);
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('beforeunload', saveNow);
        };
    }, [saveSpreadsheet]);

    // Normalize selection to ensure start and end exist
    const normalizeSelection = (selection: any) => {
        if (!selection) return null;
        if (selection.start && selection.end) return selection;
        if (selection.range) {
            const { start, end } = selection.range;
            return {
                start: { row: start.row, column: start.column },
                end: { row: end.row, column: end.column }
            };
        }
        return null;
    };

    const handleSelect = useCallback((selection: any) => {
        const normalized = normalizeSelection(selection);
        setSelected(normalized);
    }, []);

    const validateSelection = (selection: any) => {
        return selection &&
            selection.start &&
            selection.end &&
            typeof selection.start.row === 'number' &&
            typeof selection.start.column === 'number' &&
            typeof selection.end.row === 'number' &&
            typeof selection.end.column === 'number';
    };

    const handleCopy = useCallback(() => {
        if (!validateSelection(selected)) return;
        const { start, end } = selected;
        const copiedData = [];

        for (let row = start.row; row <= end.row; row++) {
            const rowData = [];
            for (let col = start.column; col <= end.column; col++) {
                rowData.push(data[row][col]);
            }
            copiedData.push(rowData);
        }

        setClipboard({ data: copiedData, mode: "copy" });
    }, [selected, data]);

    const handleCut = useCallback(() => {
        if (!validateSelection(selected)) return;
        const { start, end } = selected;
        const copiedData = [];
        const newData = [...data];

        for (let row = start.row; row <= end.row; row++) {
            const rowData = [];
            for (let col = start.column; col <= end.column; col++) {
                rowData.push(newData[row][col]);
                newData[row][col] = { value: "" };
            }
            copiedData.push(rowData);
        }

        setClipboard({ data: copiedData, mode: "cut" });
        setData(newData);
    }, [selected, data]);

    const handlePaste = useCallback(() => {
        if (!clipboard || !validateSelection(selected)) return;
        const newData = data.map(row => row.map(cell => ({ ...cell })));
        const { start } = selected;

        clipboard.data.forEach((row: any, rowIndex: number) => {
            row.forEach((cell: any, colIndex: number) => {
                const targetRow = start.row + rowIndex;
                const targetCol = start.column + colIndex;

                if (targetRow < numRows && targetCol < numCols) {
                    newData[targetRow][targetCol] = { ...cell };
                }
            });
        });

        setData(newData);
    }, [clipboard, selected, data]);

    const handleMerge = useCallback(() => {
        if (!validateSelection(selected)) return;
        const { start, end } = selected;

        if (start.row === end.row && start.column === end.column) {
            return;
        }

        const rowSpan = end.row - start.row + 1;
        const colSpan = end.column - start.column + 1;

        let mergedValue = "";
        for (let row = start.row; row <= end.row; row++) {
            for (let col = start.column; col <= end.column; col++) {
                if (data[row][col]?.value) {
                    mergedValue += data[row][col].value + " ";
                }
            }
        }

        const newData = data.map(row => row.map(cell => ({ ...cell })));
        newData[start.row][start.column] = {
            value: mergedValue.trim(),
            rowSpan: rowSpan,
            colSpan: colSpan,
            className: "merged-cell"
        } as any;

        for (let row = start.row; row <= end.row; row++) {
            for (let col = start.column; col <= end.column; col++) {
                if (row !== start.row || col !== start.column) {
                    newData[row][col] = {
                        value: "",
                        disabled: true,
                        className: "merged-hidden-cell"
                    } as any;
                }
            }
        }

        setMergedCells(prev => [
            ...prev,
            {
                start: { row: start.row, col: start.column },
                end: { row: end.row, col: end.column },
                rowSpan,
                colSpan
            }
        ]);

        setData(newData);
    }, [selected, data]);

    const handleUnmerge = useCallback(() => {
        if (!validateSelection(selected)) return;
        const { start } = selected;

        const mergedCell = mergedCells.find(
            merge => merge.start.row === start.row && merge.start.col === start.column
        );

        if (!mergedCell) return;

        const newData = data.map(row => row.map(cell => ({ ...cell })));

        for (let row = mergedCell.start.row; row <= mergedCell.end.row; row++) {
            for (let col = mergedCell.start.col; col <= mergedCell.end.col; col++) {
                newData[row][col] = {
                    value: row === mergedCell.start.row && col === mergedCell.start.col
                        ? data[row][col].value
                        : "",
                    className: ""
                } as any;
                delete (newData[row][col] as any).rowSpan;
                delete (newData[row][col] as any).colSpan;
                delete (newData[row][col] as any).disabled;
            }
        }

        setMergedCells(prev =>
            prev.filter(merge =>
                merge.start.row !== start.row || merge.start.col !== start.column
            )
        );

        setData(newData);
    }, [selected, data, mergedCells]);

    const handleClear = useCallback(() => {
        if (!validateSelection(selected)) return;
        const { start, end } = selected;
        const newData = data.map(row => row.map(cell => ({ ...cell })));

        for (let row = start.row; row <= end.row; row++) {
            for (let col = start.column; col <= end.column; col++) {
                if (!(newData[row][col] as any)?.disabled) {
                    newData[row][col] = { value: "" };
                }
            }
        }

        setData(newData);
    }, [selected, data]);

    const isSelectedCellMerged = useCallback(() => {
        if (!validateSelection(selected)) return false;
        const { start } = selected;
        return mergedCells.some(
            merge => merge.start.row === start.row && merge.start.col === start.column
        );
    }, [selected, mergedCells]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.pageX,
            y: e.pageY,
        });
    }, []);

    const handleCloseContextMenu = useCallback(() => {
        setContextMenu({ visible: false, x: 0, y: 0 });
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === "c") {
                    e.preventDefault();
                    handleCopy();
                } else if (e.key === "x") {
                    e.preventDefault();
                    handleCut();
                } else if (e.key === "v") {
                    e.preventDefault();
                    handlePaste();
                }
            } else if (e.key === "Delete") {
                handleClear();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("click", handleCloseContextMenu);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("click", handleCloseContextMenu);
        };
    }, [handleCopy, handleCut, handlePaste, handleClear, handleCloseContextMenu]);

    // Inline styles
    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column' as const,
            height: '100%',
            fontFamily: 'Arial, sans-serif',
            overflow: 'hidden',
            position: 'relative' as const,
        },
        ribbonMenu: {
            background: 'var(--ribbon-bg, #f3f3f3)',
            borderBottom: '2px solid var(--ribbon-border, #ddd)',
            padding: '10px',
            flexShrink: 0,
        },
        ribbonTab: {
            display: 'flex',
            gap: '20px',
            alignItems: 'center',
        },
        ribbonGroup: {
            display: 'flex',
            flexDirection: 'column' as const,
            padding: '0 15px',
            borderRight: '1px solid var(--ribbon-border, #ddd)',
        },
        ribbonLabel: {
            fontSize: '11px',
            color: 'var(--label-color, #666)',
            marginBottom: '5px',
            textTransform: 'uppercase' as const,
        },
        ribbonButtons: {
            display: 'flex',
            gap: '5px',
        },
        button: {
            padding: '8px 12px',
            border: '1px solid var(--button-border, #ccc)',
            background: 'var(--button-bg, white)',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '13px',
            transition: 'all 0.2s',
            color: 'var(--button-text, #1f2937)',
        },
        buttonDisabled: {
            opacity: 0.5,
            cursor: 'not-allowed',
        },
        contextMenu: {
            position: 'fixed' as const,
            background: 'var(--context-bg, white)',
            border: '1px solid var(--context-border, #ccc)',
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            minWidth: '150px',
            padding: '5px 0',
            zIndex: 1000,
        },
        contextMenuItem: {
            padding: '8px 15px',
            cursor: 'pointer',
            fontSize: '14px',
            color: 'var(--text-color, #1f2937)',
        },
        contextMenuDisabled: {
            opacity: 0.5,
            cursor: 'not-allowed',
            pointerEvents: 'none' as const,
        },
        separator: {
            height: '1px',
            background: 'var(--separator-bg, #ddd)',
            margin: '5px 0',
        },
        spreadsheetContainer: {
            flex: 1,
            overflow: 'auto',
            padding: '10px',
            background: 'var(--spreadsheet-bg, white)',
            minHeight: 0,
        },
        saveStatus: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: '500' as const,
        },
    };

    if (isLoading) {
        return (
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '16px', color: 'var(--text-color, #666)'}}>Loading spreadsheet...</div>
                </div>
            </div>
        );
    }

    return (
        <>
            <style jsx global>{`
                :root {
                    --ribbon-bg: #f3f3f3;
                    --ribbon-border: #ddd;
                    --label-color: #666;
                    --button-bg: white;
                    --button-border: #ccc;
                    --button-text: #1f2937;
                    --button-hover: #e8e8e8;
                    --context-bg: white;
                    --context-border: #ccc;
                    --context-hover: #f0f0f0;
                    --text-color: #1f2937;
                    --separator-bg: #ddd;
                    --spreadsheet-bg: white;
                }

                .dark {
                    --ribbon-bg: #1f2937;
                    --ribbon-border: #374151;
                    --label-color: #9ca3af;
                    --button-bg: #374151;
                    --button-border: #4b5563;
                    --button-text: #f9fafb;
                    --button-hover: #4b5563;
                    --context-bg: #1f2937;
                    --context-border: #374151;
                    --context-hover: #374151;
                    --text-color: #f9fafb;
                    --separator-bg: #374151;
                    --spreadsheet-bg: #111827;
                }

                /* Spreadsheet Dark Mode Overrides */
                .dark .Spreadsheet {
                    color: #f9fafb;
                }

                .dark .Spreadsheet__cell {
                    background: #1f2937;
                    border-color: #374151;
                    color: #f9fafb;
                }

                .dark .Spreadsheet__cell:hover {
                    background: #374151;
                }

                .dark .Spreadsheet__header {
                    background: #111827;
                    color: #9ca3af;
                    border-color: #374151;
                }

                /* Merged cell styling */
                .merged-cell {
                    background-color: #f8f9fa !important;
                    border: 2px solid #007bff !important;
                    font-weight: 500;
                }

                .dark .merged-cell {
                    background-color: #1e3a5f !important;
                    border-color: #3b82f6 !important;
                }

                .merged-hidden-cell {
                    background-color: #e9ecef !important;
                    pointer-events: none;
                    opacity: 0.3;
                }

                .dark .merged-hidden-cell {
                    background-color: #374151 !important;
                }

                .Spreadsheet__cell.merged-hidden-cell {
                    cursor: not-allowed;
                }

                /* Button hover effects */
                button:hover:not(:disabled) {
                    background: var(--button-hover, #e8e8e8) !important;
                }

                .dark button:hover:not(:disabled) {
                    background: #4b5563 !important;
                }

                /* Context menu hover */
                .context-menu-item:hover:not(.disabled) {
                    background: var(--context-hover, #f0f0f0);
                }

                .dark .context-menu-item:hover:not(.disabled) {
                    background: #374151;
                }
            `}</style>

            <div style={styles.container}>
                {/* Ribbon Menu */}
                <div style={styles.ribbonMenu}>
                    <div style={styles.ribbonTab}>
                        <div style={styles.ribbonGroup}>
                            <label style={styles.ribbonLabel}>Clipboard</label>
                            <div style={styles.ribbonButtons}>
                                <button
                                    onClick={handleCopy}
                                    title="Copy (Ctrl+C)"
                                    disabled={!validateSelection(selected)}
                                    style={{
                                        ...styles.button,
                                        ...((!validateSelection(selected)) && styles.buttonDisabled)
                                    }}
                                >
                                    📋 Copy
                                </button>
                                <button
                                    onClick={handleCut}
                                    title="Cut (Ctrl+X)"
                                    disabled={!validateSelection(selected)}
                                    style={{
                                        ...styles.button,
                                        ...((!validateSelection(selected)) && styles.buttonDisabled)
                                    }}
                                >
                                    ✂️ Cut
                                </button>
                                <button
                                    onClick={handlePaste}
                                    title="Paste (Ctrl+V)"
                                    disabled={!clipboard}
                                    style={{
                                        ...styles.button,
                                        ...(!clipboard && styles.buttonDisabled)
                                    }}
                                >
                                    📄 Paste
                                </button>
                            </div>
                        </div>

                        <div style={styles.ribbonGroup}>
                            <label style={styles.ribbonLabel}>Cells</label>
                            <div style={styles.ribbonButtons}>
                                <button
                                    onClick={handleMerge}
                                    disabled={!validateSelection(selected)}
                                    title="Merge selected cells"
                                    style={{
                                        ...styles.button,
                                        ...((!validateSelection(selected)) && styles.buttonDisabled)
                                    }}
                                >
                                    🔗 Merge
                                </button>
                                <button
                                    onClick={handleUnmerge}
                                    disabled={!isSelectedCellMerged()}
                                    title="Unmerge cells"
                                    style={{
                                        ...styles.button,
                                        ...(!isSelectedCellMerged() && styles.buttonDisabled)
                                    }}
                                >
                                    ↔️ Unmerge
                                </button>
                                <button
                                    onClick={handleClear}
                                    disabled={!validateSelection(selected)}
                                    style={{
                                        ...styles.button,
                                        ...((!validateSelection(selected)) && styles.buttonDisabled)
                                    }}
                                >
                                    🗑️ Clear
                                </button>
                            </div>
                        </div>

                        {/* Save Status Indicator */}
                        <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center'}}>
                            {saveStatus === 'saving' && (
                                <div style={{
                                    ...styles.saveStatus,
                                    background: '#fef3c7',
                                    color: '#92400e',
                                }}>
                                    <svg style={{width: '16px', height: '16px', animation: 'spin 1s linear infinite'}}
                                         viewBox="0 0 24 24">
                                        <circle style={{opacity: 0.25}} cx="12" cy="12" r="10" stroke="currentColor"
                                                strokeWidth="4" fill="none"></circle>
                                        <path style={{opacity: 0.75}} fill="currentColor"
                                              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                    </svg>
                                    <span>Saving...</span>
                                </div>
                            )}
                            {saveStatus === 'saved' && (
                                <div style={{
                                    ...styles.saveStatus,
                                    background: '#d1fae5',
                                    color: '#065f46',
                                }}>
                                    <svg style={{width: '16px', height: '16px'}} viewBox="0 0 24 24" fill="none"
                                         stroke="currentColor" strokeWidth="2">
                                        <path d="M20 6L9 17l-5-5"/>
                                    </svg>
                                    <span>Saved</span>
                                </div>
                            )}
                            {saveStatus === 'error' && (
                                <div style={{
                                    ...styles.saveStatus,
                                    background: '#fee2e2',
                                    color: '#991b1b',
                                }}>
                                    <svg style={{width: '16px', height: '16px'}} viewBox="0 0 24 24" fill="none"
                                         stroke="currentColor" strokeWidth="2">
                                        <path d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                    <span>Save failed</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Context Menu */}
                {contextMenu.visible && (
                    <div
                        style={{
                            ...styles.contextMenu,
                            top: contextMenu.y,
                            left: contextMenu.x,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            onClick={() => {
                                handleCopy();
                                handleCloseContextMenu();
                            }}
                            className={`context-menu-item ${!validateSelection(selected) ? "disabled" : ""}`}
                            style={{
                                ...styles.contextMenuItem,
                                ...((!validateSelection(selected)) && styles.contextMenuDisabled)
                            }}
                        >
                            Copy
                        </div>
                        <div
                            onClick={() => {
                                handleCut();
                                handleCloseContextMenu();
                            }}
                            className={`context-menu-item ${!validateSelection(selected) ? "disabled" : ""}`}
                            style={{
                                ...styles.contextMenuItem,
                                ...((!validateSelection(selected)) && styles.contextMenuDisabled)
                            }}
                        >
                            Cut
                        </div>
                        <div
                            onClick={() => {
                                handlePaste();
                                handleCloseContextMenu();
                            }}
                            className={`context-menu-item ${!clipboard ? "disabled" : ""}`}
                            style={{
                                ...styles.contextMenuItem,
                                ...(!clipboard && styles.contextMenuDisabled)
                            }}
                        >
                            Paste
                        </div>
                        <div style={styles.separator}></div>
                        <div
                            onClick={() => {
                                handleMerge();
                                handleCloseContextMenu();
                            }}
                            className={`context-menu-item ${!validateSelection(selected) ? "disabled" : ""}`}
                            style={{
                                ...styles.contextMenuItem,
                                ...((!validateSelection(selected)) && styles.contextMenuDisabled)
                            }}
                        >
                            Merge Cells
                        </div>
                        {isSelectedCellMerged() && (
                            <div
                                onClick={() => {
                                    handleUnmerge();
                                    handleCloseContextMenu();
                                }}
                                className="context-menu-item"
                                style={styles.contextMenuItem}
                            >
                                Unmerge Cells
                            </div>
                        )}
                        <div
                            onClick={() => {
                                handleClear();
                                handleCloseContextMenu();
                            }}
                            className={`context-menu-item ${!validateSelection(selected) ? "disabled" : ""}`}
                            style={{
                                ...styles.contextMenuItem,
                                ...((!validateSelection(selected)) && styles.contextMenuDisabled)
                            }}
                        >
                            Clear Contents
                        </div>
                    </div>
                )}

                {/* Spreadsheet */}
                <div
                    ref={spreadsheetRef}
                    onContextMenu={handleContextMenu}
                    style={styles.spreadsheetContainer}
                >
                    <Spreadsheet
                        data={data}
                        onChange={(newData) => setData(newData as any)}
                        onSelect={handleSelect}
                        columnLabels={Array.from({ length: numCols }, (_, i) =>
                            String.fromCharCode(65 + (i % 26))
                        )}
                    />
                </div>
            </div>

            <style jsx>{`
                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </>
    );
}