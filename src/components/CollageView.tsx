
'use client';

import type { DiaryEvent, EventContent, ImageContent, TextContent, ImageTextContent, GalleryContent } from '@/types';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CollageViewProps {
    event: DiaryEvent;
    content: EventContent[];
}

export function CollageView({ event, content }: CollageViewProps) {

    const allImages: (ImageContent | { type: 'main'; value: string, width?:number, height?:number })[] = [
        { type: 'main', value: event.imageUrl, width: event.width, height: event.height },
        ...content.flatMap(c => {
            if (c.type === 'image') return [{ ...c, value: c.value }];
            if (c.type === 'gallery') return c.images.map(img => ({ ...img, type: 'image' as const, id: Math.random().toString(), createdAt: c.createdAt }));
            if (c.type === 'imageText') return [{ type: 'image' as const, value: c.imageUrl, width: c.width, height: c.height, id: c.id, createdAt: c.createdAt }];
            return [];
        })
    ];

    const allText = content.filter(c => c.type === 'text' || c.type === 'imageText') as (TextContent | ImageTextContent)[];

    return (
        <div className="bg-background p-4 sm:p-6 font-body">
            <header className="text-center mb-8 border-b-2 pb-4 border-primary/50">
                <h1 className="text-4xl font-headline font-bold text-primary">{event.title}</h1>
                <p className="text-muted-foreground mt-2">
                    {format(new Date(event.createdAt), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
                <p className="text-lg mt-4 max-w-3xl mx-auto">{event.description}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Text Column */}
                <div className="md:col-span-1 space-y-6">
                    {allText.map((item, index) => (
                        <div key={`text-${index}`} className="p-4 bg-secondary/50 rounded-lg shadow-sm">
                            <p className="whitespace-pre-wrap text-secondary-foreground">
                                {item.type === 'text' ? item.value : item.text}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Image Column */}
                <div className="md:col-span-2">
                    <div className="columns-2 gap-4">
                        {allImages.map((img, index) => (
                             <div key={`img-${index}`} className="mb-4 break-inside-avoid-column rounded-lg overflow-hidden shadow-lg">
                                {img.width && img.height ? (
                                     <Image
                                        src={img.value}
                                        alt={`Recuerdo ${index}`}
                                        width={img.width}
                                        height={img.height}
                                        className="object-cover w-full h-auto"
                                    />
                                ): (
                                    <div className="w-full relative aspect-[4/3]">
                                        <Image
                                            src={img.value}
                                            alt={`Recuerdo ${index}`}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
