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
            <Tldraw
                licenseKey='tldraw-2026-02-25/WyJDd1FjTzVOWiIsWyIqIl0sMTYsIjIwMjYtMDItMjUiXQ.6SjAGtDmbrZj+mebgzhmbiRN715/aKs0UbEV6KdpgzimEELQQQaQhB4ashVhZ0DxtL2MVfijw6wi5U60u3zQ2A'
                store={store}
            />
        </div>
    );
}