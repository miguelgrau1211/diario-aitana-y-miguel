
'use client';

import * as React from 'react';
import Image from 'next/image';
import useEmblaCarousel, { type EmblaCarouselType } from 'embla-carousel-react';

import type { DiaryEvent, EventContent } from '@/types';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface VideoPlayerProps {
  event: DiaryEvent;
  content: EventContent[];
}

type Slide = 
    | { type: 'title'; title: string; description: string; imageUrl: string }
    | { type: 'image'; url: string; width: number; height: number; }
    | { type: 'text'; value: string; }
    | { type: 'imageText'; imageUrl: string; text: string; imagePosition: 'left' | 'right'; width: number; height: number; };

const SLIDE_DURATION = 5000; // 5 seconds per slide

export function VideoPlayer({ event, content }: VideoPlayerProps) {
  const slides: Slide[] = React.useMemo(() => {
    const allSlides: Slide[] = [];

    // 1. Title slide
    allSlides.push({
        type: 'title',
        title: event.title,
        description: event.description,
        imageUrl: event.imageUrl
    });

    // 2. Content slides
    content.forEach(item => {
        switch(item.type) {
            case 'text':
                allSlides.push({ type: 'text', value: item.value });
                break;
            case 'image':
                allSlides.push({ type: 'image', url: item.value, width: item.width || 500, height: item.height || 500 });
                break;
            case 'gallery':
                item.images.forEach(img => {
                    allSlides.push({ type: 'image', url: img.value, width: img.width, height: img.height });
                });
                break;
            case 'imageText':
                 allSlides.push({ type: 'imageText', imageUrl: item.imageUrl, text: item.text, imagePosition: item.imagePosition, width: item.width, height: item.height });
                 break;
        }
    });

    return allSlides;
  }, [event, content]);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (!emblaApi) return;

    const updateProgress = () => {
        const progress = Math.max(0, Math.min(1, emblaApi.scrollProgress()));
        setProgress(progress * 100);
    }

    const timer = setInterval(() => {
        if (emblaApi) {
            emblaApi.scrollNext();
        }
    }, SLIDE_DURATION);

    emblaApi.on('scroll', updateProgress);
    emblaApi.on('reInit', updateProgress);
    
    return () => {
        clearInterval(timer);
    };
  }, [emblaApi]);


  return (
    <div className="w-full h-full bg-black relative overflow-hidden flex flex-col">
        <div className="embla flex-1" ref={emblaRef}>
            <div className="embla__container h-full">
            {slides.map((slide, index) => (
                <div key={index} className="embla__slide relative h-full flex items-center justify-center">
                    {slide.type === 'title' && (
                        <>
                            <Image src={slide.imageUrl} alt={slide.title} fill className="object-cover opacity-30 ken-burns-effect" />
                            <div className="relative z-10 text-center text-white p-8">
                                <h2 className="text-4xl md:text-6xl font-headline font-bold drop-shadow-lg">{slide.title}</h2>
                                <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto drop-shadow-md">{slide.description}</p>
                            </div>
                        </>
                    )}
                     {slide.type === 'image' && (
                        <Image src={slide.url} alt={`Slide ${index}`} width={slide.width} height={slide.height} className="object-contain max-h-full max-w-full ken-burns-effect" />
                    )}
                    {slide.type === 'text' && (
                        <div className="text-center text-white p-12 max-w-3xl">
                            <p className="text-2xl md:text-4xl leading-relaxed font-body italic">"{slide.value}"</p>
                        </div>
                    )}
                    {slide.type === 'imageText' && (
                         <div className="w-full h-full flex items-center justify-center p-8">
                            <div className={cn("grid grid-cols-2 gap-8 items-center w-full max-w-5xl", slide.imagePosition === 'right' && "md:grid-flow-col-dense")}>
                                <div className={cn("relative w-full h-64", slide.imagePosition === 'right' && 'md:col-start-2')}>
                                    <Image src={slide.imageUrl} alt="Recuerdo" fill className="object-contain ken-burns-effect" />
                                </div>
                                <div className="p-6 text-white">
                                    <p className="whitespace-pre-wrap text-lg italic">"{slide.text}"</p>
                                </div>
                            </div>
                         </div>
                    )}
                </div>
            ))}
            </div>
        </div>
         <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
            <Progress value={progress} className="w-full h-1 bg-white/20 [&>div]:bg-white" />
        </div>
    </div>
  );
}
