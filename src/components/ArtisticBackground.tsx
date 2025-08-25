
'use client';

import { useEffect, useState } from 'react';

const HeartIcon = () => (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
);

const FlowerIcon = () => (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 17.1c-2.8 0-5.1-2.3-5.1-5.1s2.3-5.1 5.1-5.1 5.1 2.3 5.1 5.1-2.3 5.1-5.1 5.1zm0-8.2c-1.7 0-3.1 1.4-3.1 3.1s1.4 3.1 3.1 3.1 3.1-1.4 3.1-3.1-1.4-3.1-3.1-3.1z"/>
        <path d="M12 22c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0-18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM4 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM20 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM6.4 7.8c-.8.8-2.1.8-2.8 0s-.8-2.1 0-2.8.8-.8 2.8 0 .8 2.1 0 2.8zM17.6 19.2c-.8.8-2.1.8-2.8 0s-.8-2.1 0-2.8.8-.8 2.8 0 .8 2.1 0 2.8zM6.4 19.2c.8-.8.8-2.1 0-2.8s-2.1-.8-2.8 0-.8.8 0 2.8c.8.7 2 .7 2.8 0zM17.6 7.8c.8-.8.8-2.1 0-2.8s-2.1-.8-2.8 0-.8.8 0 2.8c.7.8 2 .8 2.8 0z"/>
    </svg>
);

interface Shape {
    id: number;
    style: React.CSSProperties;
    component: React.FC;
}

export function ArtisticBackground() {
    const [shapes, setShapes] = useState<Shape[]>([]);

    useEffect(() => {
        const generatedShapes: Shape[] = Array.from({ length: 20 }).map((_, i) => {
            const size = Math.random() * 40 + 20; // 20px to 60px
            const left = Math.random() * 100;
            const animationDuration = Math.random() * 15 + 20; // 20s to 35s
            const animationDelay = Math.random() * 15;
            const Component = Math.random() > 0.4 ? HeartIcon : FlowerIcon;

            return {
                id: i,
                component: Component,
                style: {
                    width: `${size}px`,
                    height: `${size}px`,
                    left: `${left}%`,
                    animationDuration: `${animationDuration}s`,
                    animationDelay: `${animationDelay}s`,
                },
            };
        });

        setShapes(generatedShapes);
    }, []);

    if (typeof window === 'undefined') {
        return null;
    }

    return (
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            {shapes.map(shape => (
                <div key={shape.id} className="floating-shape" style={shape.style}>
                    <shape.component />
                </div>
            ))}
        </div>
    );
}
