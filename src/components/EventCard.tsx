
"use client";

import type { DiaryEvent } from "@/types";
import Image from "next/image";
import Link from 'next/link';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface EventCardProps {
  event: DiaryEvent;
}

export function EventCard({ event }: EventCardProps) {
  const eventDate = event.createdAt;

  return (
    <Link href={`/event/${event.id}`} className="block transition-all hover:shadow-lg hover:-translate-y-1 duration-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
      <Card className="w-full overflow-hidden h-full flex flex-col">
        <CardHeader className="p-0">
          <div className="relative w-full">
            {event.width && event.height ? (
              <Image
                src={event.imageUrl}
                alt={event.title}
                width={event.width}
                height={event.height}
                className="object-cover w-full h-auto"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              // Fallback for old events without width/height
              <div className="aspect-[4/3] w-full relative">
                 <Image
                    src={event.imageUrl}
                    alt={event.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <CardTitle className="font-headline text-xl mb-2">{event.title}</CardTitle>
          <p className="text-muted-foreground text-sm line-clamp-3">{event.description}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="mr-1.5 h-4 w-4" />
            <time dateTime={eventDate.toISOString()}>
              {format(eventDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
            </time>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
