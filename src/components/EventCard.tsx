"use client";

import type { DiaryEvent } from "@/types";
import Image from "next/image";
import Link from 'next/link';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { deleteEventAction } from "@/app/add-event/actions";

interface EventCardProps {
  event: DiaryEvent;
}

export function EventCard({ event }: EventCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  // The date is now a Date object
  const eventDate = event.createdAt;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setIsDeleting(true);
    try {
      const result = await deleteEventAction({ id: event.id, imageUrl: event.imageUrl });
      if (result?.error) {
        throw new Error(result.error);
      }
      toast({
        title: "Recuerdo eliminado",
        description: "El momento ha sido eliminado de vuestro diario.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "No se pudo eliminar el recuerdo.";
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: errorMessage,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Link href={`/event/${event.id}`} className="block transition-all hover:shadow-lg hover:-translate-y-1 duration-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
      <Card className="w-full overflow-hidden h-full flex flex-col">
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
          <AlertDialog onOpenChange={(open) => {
            if (open) {
              // Prevent link navigation when opening dialog
              event.stopPropagation?.();
            }
          }}>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Eliminar Recuerdo</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente el recuerdo de vuestro diario.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </Link>
  );
}
