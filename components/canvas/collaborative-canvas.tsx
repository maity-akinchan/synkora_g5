'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Tldraw, Editor, toRichText } from 'tldraw';
import { useSocket } from '@/hooks/use-socket';

interface CollaborativeCanvasProps {
    projectId: string;
    canvasId: string;
}

export function CollaborativeCanvas({ projectId, canvasId }: CollaborativeCanvasProps) {
    const [editor, setEditor] = useState<Editor | null>(null);
    const { socket, isConnected } = useSocket();

    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    // Flags & timers
    const isLoadingRef = useRef(false);
    const isSavingRef = useRef(false);
    const isRemoteUpdateRef = useRef(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const logIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const defaultSeededRef = useRef(false);

    // --- Theme (no next-themes): auto-detect OS dark mode, and respect `html.dark` if present ---
    const [tldrawTheme, setTldrawTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const media = window.matchMedia?.('(prefers-color-scheme: dark)');
        const getTheme = () => {
            // If your app uses Tailwind's class-based dark mode, honor it:
            if (document.documentElement.classList.contains('dark')) return 'dark';
            return media?.matches ? 'dark' : 'light';
        };

        setTldrawTheme(getTheme());

        const onMediaChange = (e: MediaQueryListEvent) => setTldrawTheme(e.matches ? 'dark' : 'light');
        media?.addEventListener?.('change', onMediaChange);

        // Watch for changes to <html class="dark"> (common in Tailwind setups)
        const observer = new MutationObserver(() => setTldrawTheme(getTheme()));
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => {
            media?.removeEventListener?.('change', onMediaChange);
            observer.disconnect();
        };
    }, []);
    // --- Load canvas state from backend ---
    const loadCanvasState = async () => {
        if (!editor || isLoadingRef.current) return;
        isLoadingRef.current = true;
        try {
            const response = await fetch(`/api/projects/${projectId}/canvas`);
            if (response.ok) {
                const data = await response.json();
                console.log('Loaded canvas state:', data);
                const hasState = !!(data.state && Object.keys(data.state).length > 0);

                if (hasState) {
                    try {
                        // @ts-ignore using internal snapshot API
                        await editor.store.loadSnapshot(data.state);
                        // Edge: if snapshot loads but there are no shapes
                        if (editor.getCurrentPageShapeIds().size === 0) {
                            seedDefaultSynkora(editor);
                        }
                    } catch (err) {
                        console.warn('Could not load canvas snapshot:', err);
                        seedDefaultSynkora(editor);
                    }
                } else {
                    // No persisted state — seed default
                    seedDefaultSynkora(editor);
                }
            } else {
                // Not OK — still seed to keep UX smooth
                seedDefaultSynkora(editor);
            }
        } catch (error) {
            console.error('Failed to load canvas state:', error);
            seedDefaultSynkora(editor);
        } finally {
            isLoadingRef.current = false;
        }
    };

    // --- Default seeding helper (uses richText per latest tldraw API) ---
    const seedDefaultSynkora = (e: Editor) => {
        if (!e || defaultSeededRef.current) return;
        if (e.getCurrentPageShapeIds().size > 0) return;

        // Place near the center of the viewport
        const vb = e.getViewportPageBounds();
        const cx = vb ? vb.x + vb.width / 2 : 0;
        const cy = vb ? vb.y + vb.height / 2 : 0;

        const create = () => {
            e.createShape({
                type: 'text',
                x: cx - 200,
                y: cy - 60,
                props: {
                    // NEW: rich text prop instead of "text"
                    richText: toRichText('Synkora'),
                    autoSize: true,
                    // Style props (see TLTextShapeProps in docs)
                    color: 'green',
                    size: 'xl',
                    font: 'sans',
                    textAlign: 'middle',
                },
            });
        };

        try {
            if (typeof (e as any).batch === 'function') {
                (e as any).batch(create);
            } else if (typeof (e as any).run === 'function') {
                (e as any).run(create);
            } else {
                create();
            }
            defaultSeededRef.current = true;
        } catch (err) {
            console.error('Failed to seed default Synkora text:', err);
        }
    };

    // --- Load canvas state on mount; seed default if none or empty ---
    useEffect(() => {
        loadCanvasState();
    }, [editor, projectId]);

    // --- Debounced save function ---
    const saveCanvasState = useCallback(async () => {
        if (!editor || isSavingRef.current) return;

        // mark saving state
        isSavingRef.current = true;
        setSaveStatus('saving');
        try {
            const allRecords = editor.store.allRecords();
            const snapshot = {
                store: Object.fromEntries(allRecords.map((r) => [r.id, r])),
                schema: editor.store.schema.serialize(),
            };

            // Ensure the snapshot is JSON-serializable. Try direct stringify first.
            let bodyPayload: string;
            try {
                bodyPayload = JSON.stringify({ state: snapshot });
            } catch (err) {
                console.warn('Snapshot not directly serializable, attempting structured clone fallback', err);
                try {
                    // Try to make a shallow plain object copy of store
                    const plainStore: Record<string, any> = {};
                    const allRecords = editor.store.allRecords();
                    allRecords.forEach((r: any) => {
                        try {
                            plainStore[r.id] = JSON.parse(JSON.stringify(r));
                        } catch (e) {
                            // Last resort: copy only primitive props
                            const copy: any = {};
                            Object.keys(r).forEach((k) => {
                                const v = (r as any)[k];
                                if (v === null) copy[k] = null;
                                else if (['string', 'number', 'boolean'].includes(typeof v)) copy[k] = v;
                            });
                            plainStore[r.id] = copy;
                        }
                    });

                    const fallback = { store: plainStore, schema: editor.store.schema.serialize() };
                    bodyPayload = JSON.stringify({ state: fallback });
                } catch (e2) {
                    console.error('Failed to produce serializable snapshot for canvas save', e2);
                    throw e2;
                }
            }

            const res = await fetch(`/api/projects/${projectId}/canvas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: bodyPayload,
            });

            if (!res.ok) {
                const text = await res.text().catch(() => '<no body>');
                console.error('Canvas save failed:', res.status, text);
                throw new Error(`Failed to persist canvas: ${res.status}`);
            }

            setSaveStatus('saved');
            // keep 'saved' visible briefly
            setTimeout(() => {
                setSaveStatus('idle');
            }, 1500);
        } catch (error) {
            console.error('Failed to save canvas state:', error);
            setSaveStatus('error');
        } finally {
            isSavingRef.current = false;
        }
    }, [editor, projectId]);

    // --- Listen to local store changes, broadcast to other users, and debounce save ---
    useEffect(() => {
        if (!editor || !socket || !isConnected) return;

        const handleChange = (entry: any) => {
            if (isRemoteUpdateRef.current) return;

            const { changes } = entry;
            if (
                Object.keys(changes.added).length > 0 ||
                Object.keys(changes.updated).length > 0 ||
                Object.keys(changes.removed).length > 0
            ) {
                socket.emit('canvas:update', {
                    projectId,
                    changes: {
                        added: changes.added,
                        updated: changes.updated,
                        removed: changes.removed,
                    },
                });

                // Save 3 seconds after the last change
                if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
                }
                saveTimeoutRef.current = setTimeout(() => {
                    saveCanvasState();
                }, 3000);
            }
        };

        const unsubscribe = editor.store.listen(handleChange, {
            scope: 'document',
            source: 'user',
        });

        return () => {
            unsubscribe();
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [editor, socket, isConnected, projectId, saveCanvasState]);

    // --- Save on window blur, visibility change, beforeunload, and editor focus loss ---
    useEffect(() => {
        if (!editor) return;

        const saveNow = () => {
            // clear any pending debounce and save immediately
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = null;
            }
            // fire and don't await
            void saveCanvasState();
        };

        const onVisibility = () => {
            if (document.hidden) saveNow();
        };

        const onBlur = () => saveNow();

        const container = editor.getContainer();
        container.addEventListener('focusout', onBlur);
        window.addEventListener('blur', onBlur);
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('beforeunload', saveNow);

        return () => {
            container.removeEventListener('focusout', onBlur);
            window.removeEventListener('blur', onBlur);
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('beforeunload', saveNow);
        };
    }, [editor, saveCanvasState]);

    // --- Handle incoming canvas updates from other users ---
    useEffect(() => {
        if (!socket || !isConnected || !editor) return;

        const handleCanvasUpdate = (data: any) => {
            // Mark as remote update to prevent re-broadcasting
            isRemoteUpdateRef.current = true;

            try {
                editor.store.mergeRemoteChanges(() => {
                    // Add new records
                    if (data.added) {
                        Object.values(data.added).forEach((record: any) => {
                            editor.store.put([record]);
                        });
                    }
                    // Update existing records
                    if (data.updated) {
                        Object.values(data.updated).forEach(([, newRecord]: any) => {
                            editor.store.put([newRecord]);
                        });
                    }
                    // Remove deleted records
                    if (data.removed) {
                        Object.keys(data.removed).forEach((id) => {
                            editor.store.remove([id as any]);
                        });
                    }
                });
            } catch (error) {
                console.error('Failed to apply remote canvas changes:', error);
            } finally {
                // Reset flag after a short delay
                setTimeout(() => {
                    isRemoteUpdateRef.current = false;
                }, 100);
            }
        };

        socket.on('canvas:update', handleCanvasUpdate);
        return () => {
            socket.off('canvas:update', handleCanvasUpdate);
        };
    }, [socket, isConnected, editor]);

    // --- Broadcast cursor position (debounced) ---
    useEffect(() => {
        if (!socket || !isConnected || !editor) return;

        let cursorTimeout: NodeJS.Timeout | null = null;

        const broadcastCursor = () => {
            const { currentPagePoint } = editor.inputs;
            if (currentPagePoint) {
                socket.emit('canvas:cursor', {
                    projectId,
                    position: { x: currentPagePoint.x, y: currentPagePoint.y },
                });
            }
        };

        const handlePointerMove = () => {
            if (cursorTimeout) clearTimeout(cursorTimeout);
            cursorTimeout = setTimeout(broadcastCursor, 100);
        };

        const container = editor.getContainer();
        container.addEventListener('pointermove', handlePointerMove);

        return () => {
            if (cursorTimeout) clearTimeout(cursorTimeout);
            container.removeEventListener('pointermove', handlePointerMove);
        };
    }, [socket, isConnected, editor, projectId]);

    // --- Join/leave project room & final save on unmount ---
    useEffect(() => {
        if (!socket || !isConnected || !editor) return;

        socket.emit('join-project', projectId);

        return () => {
            socket.emit('leave-project', projectId);
            // Save one final time when leaving
            saveCanvasState();
        };
    }, [socket, isConnected, editor, projectId, saveCanvasState]);

    // --- Console log full editor snapshot every 10 seconds ---
    useEffect(() => {
        if (!editor) return;

        const logEditorState = () => {
            try {
                const allRecords = editor.store.allRecords();
                const snapshot = {
                    store: Object.fromEntries(allRecords.map((r) => [r.id, r])),
                    schema: editor.store.schema.serialize(),
                };
                console.log('[Canvas Snapshot @', new Date().toISOString(), ']:');
                console.log(JSON.stringify(snapshot, null, 2));
            } catch (error) {
                console.error('Failed to log editor state:', error);
            }
        };

        logIntervalRef.current = setInterval(logEditorState, 10_000);
        return () => {
            if (logIntervalRef.current) {
                clearInterval(logIntervalRef.current);
                logIntervalRef.current = null;
            }
        };
    }, [editor]);

    return (
        <div className={`relative w-full h-full ${tldrawTheme === 'dark' ? 'bg-neutral-900' : 'bg-white'}`}>
            {/* Save status badge (top-right) */}
            <div className="absolute right-3 top-3 z-50">
                {saveStatus === 'saving' && (
                    <div className="flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded shadow">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                        <span className="text-xs">Saving…</span>
                    </div>
                )}
                {saveStatus === 'saved' && (
                    <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-2 py-1 rounded shadow">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 6L9 17l-5-5" />
                        </svg>
                        <span className="text-xs">Saved</span>
                    </div>
                )}
                {saveStatus === 'error' && (
                    <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-2 py-1 rounded shadow">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-xs">Save failed</span>
                    </div>
                )}
            </div>

            <Tldraw
                onMount={(ed) => setEditor(ed)}
                licenseKey='tldraw-2026-02-25/WyJDd1FjTzVOWiIsWyIqIl0sMTYsIjIwMjYtMDItMjUiXQ.6SjAGtDmbrZj+mebgzhmbiRN715/aKs0UbEV6KdpgzimEELQQQaQhB4ashVhZ0DxtL2MVfijw6wi5U60u3zQ2A'
            />
        </div>
    );
}