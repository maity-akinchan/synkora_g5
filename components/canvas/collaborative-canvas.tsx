'use client';

import { useEffect, useState } from 'react';
import { Tldraw } from 'tldraw';
import { useSyncDemo } from '@tldraw/sync';

interface CollaborativeCanvasProps {
    projectId: string;
    canvasId: string;
}

export function CollaborativeCanvas({ projectId, canvasId }: CollaborativeCanvasProps) {
    // Use tldraw's built-in sync for real-time collaboration
    const store = useSyncDemo({ roomId: `canvas-${canvasId}` });

    // Theme detection for tldraw
    const [tldrawTheme, setTldrawTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const media = window.matchMedia?.('(prefers-color-scheme: dark)');
        const getTheme = () => {
            if (document.documentElement.classList.contains('dark')) return 'dark';
            return media?.matches ? 'dark' : 'light';
        };

        setTldrawTheme(getTheme());

        const onMediaChange = (e: MediaQueryListEvent) => setTldrawTheme(e.matches ? 'dark' : 'light');
        media?.addEventListener?.('change', onMediaChange);

        const observer = new MutationObserver(() => setTldrawTheme(getTheme()));
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => {
            media?.removeEventListener?.('change', onMediaChange);
            observer.disconnect();
        };
    }, []);

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
                licenseKey='tldraw-2026-02-25/WyJDd1FjTzVOWiIsWyIqIl0sMTYsIjIwMjYtMDItMjUiXQ.6SjAGtDmbrZj+mebgzhmbiRN715/aKs0UbEV6KdpgzimEELQQQaQhB4ashVhZ0DxtL2MVfijw6wi5U60u3zQ2A'
                store={store}
            />
        </div>
    );
}