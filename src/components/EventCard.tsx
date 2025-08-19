"use client";

import type { DiaryEvent } from "@/types";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface EventCardProps {
  event: DiaryEvent;
}

export function EventCard({ event }: EventCardProps) {
  const eventDate = event.createdAt.toDate();
  return (
    <Card className="w-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 duration-300">
      <CardHeader className="p-0">
        <div className="aspect-video relative">
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="font-headline text-xl mb-2">{event.title}</CardTitle>
        <p className="text-muted-foreground text-sm line-clamp-3">{event.description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-end">
        <div className="flex items-center text-xs text-muted-foreground">
          <Calendar className="mr-1.5 h-4 w-4" />
          <time dateTime={eventDate.toISOString()}>
            {format(eventDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
          </time>
        </div>
      </CardFooter>
    </Card>
  );
}
