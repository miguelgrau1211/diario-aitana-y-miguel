
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

const SparkleIcon = () => (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
       <path d="M12 2.69l.94 2.89H15.9l-2.45 1.79.94 2.89L12 8.48l-2.45 1.79.94-2.89L8.1 5.58h2.96L12 2.69zM12 15.31l-.94-2.89H8.1l2.45-1.79-.94-2.89L12 9.52l2.45-1.79-.94 2.89 2.45 1.79h-2.96L12 15.31zM4 11.5l.94 2.89H7.9l-2.45 1.79.94 2.89L4 17.28l-2.45 1.79.94-2.89-2.45-1.79h2.96L4 11.5zm16 0l.94 2.89h2.96l-2.45 1.79.94 2.89L20 17.28l-2.45 1.79.94-2.89-2.45-1.79h2.96L20 11.5z"/>
    </svg>
);


interface Shape {
    id: number;
    style: React.CSSProperties;
    component: React.FC;
}

const shapeComponents = [HeartIcon, FlowerIcon, SparkleIcon];
const colors = ['hsl(var(--primary) / 0.8)', 'hsl(var(--accent) / 0.8)'];


export function ArtisticBackground() {
    const [shapes, setShapes] = useState<Shape[]>([]);

    useEffect(() => {
        const generatedShapes: Shape[] = Array.from({ length: 30 }).map((_, i) => {
            const size = Math.random() * 35 + 15; // 15px to 50px
            const left = Math.random() * 100;
            const animationDuration = Math.random() * 20 + 20; // 20s to 40s
            const animationDelay = Math.random() * 20;
            const startOpacity = Math.random() * 0.4 + 0.1; // 0.1 to 0.5
            const translateXMid = `${(Math.random() - 0.5) * 20}vw`; // Drifts +/- 10vw
            const translateXEnd = `${(Math.random() - 0.5) * 20}vw`;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const Component = shapeComponents[Math.floor(Math.random() * shapeComponents.length)];

            return {
                id: i,
                component: Component,
                style: {
                    width: `${size}px`,
                    height: `${size}px`,
                    left: `${left}%`,
                    color,
                    '--start-opacity': startOpacity,
                    '--translate-x-mid': translateXMid,
                    '--translate-x-end': translateXEnd,
                    animationDuration: `${animationDuration}s`,
                    animationDelay: `${animationDelay}s`,
                } as React.CSSProperties,
            };
        });

        setShapes(generatedShapes);
    }, []);

    return (
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-[-1]">
            {shapes.map(shape => (
                <div key={shape.id} className="floating-shape" style={shape.style}>
                    <shape.component />
                </div>
            ))}
        </div>
    );
}
