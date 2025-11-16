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

    // --- Default seeding helper (uses richText per latest tldraw API) ---
    const seedDefaultSynkora = (e: Editor) => {
        if (!e || defaultSeededRef.current) return;
        if (e.getCurrentPageShapeIds().length > 0) return;

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
        if (!editor || isLoadingRef.current) return;

        const loadCanvasState = async () => {
            isLoadingRef.current = true;
            try {
                const response = await fetch(`/api/projects/${projectId}/canvas`);
                if (response.ok) {
                    const data = await response.json();
                    const hasState = !!(data.state && Object.keys(data.state).length > 0);

                    if (hasState) {
                        try {
                            // @ts-ignore using internal snapshot API
                            await editor.store.loadSnapshot(data.state);
                            // Edge: if snapshot loads but there are no shapes
                            if (editor.getCurrentPageShapeIds().length === 0) {
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

        loadCanvasState();
    }, [editor, projectId]);

    // --- Debounced save function ---
    const saveCanvasState = useCallback(async () => {
        if (!editor || isSavingRef.current) return;

        isSavingRef.current = true;
        try {
            const allRecords = editor.store.allRecords();
            const snapshot = {
                store: Object.fromEntries(allRecords.map((r) => [r.id, r])),
                schema: editor.store.schema.serialize(),
            };

            await fetch(`/api/projects/${projectId}/canvas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state: snapshot }),
            });
        } catch (error) {
            console.error('Failed to save canvas state:', error);
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
        <div className={`w-full h-full ${tldrawTheme === 'dark' ? 'bg-neutral-900' : 'bg-white'}`}>
            <Tldraw
                theme={tldrawTheme}
                onMount={(ed) => setEditor(ed)}
            />
        </div>
    );
}