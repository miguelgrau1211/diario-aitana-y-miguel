
'use client';

import { useEffect, useState, useOptimistic, startTransition, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { DiaryEvent, EventContent } from '@/types';
import { getEventAction, getEventContentAction, deleteEventAction } from './actions';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ImagePlus, FileText, Trash2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { AddTextDialog } from '@/components/AddTextDialog';
import { AddImageDialog } from '@/components/AddImageDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const [event, setEvent] = useState<DiaryEvent | null>(null);
  const [content, setContent] = useState<EventContent[]>([]);
  const [optimisticContent, setOptimisticContent] = useOptimistic(
    content,
    (state: EventContent[], newContent: EventContent) => [
      ...state,
      newContent
    ]
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const [isTextDialogOpen, setTextDialogOpen] = useState(false);
  const [isImageDialogOpen, setImageDialogOpen] = useState(false);

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (id) {
      const fetchEventData = async () => {
        setLoading(true);
        setError(null);
        try {
          const eventResult = await getEventAction(id);
          if (eventResult.error) throw new Error(eventResult.error);
          if (eventResult.event) {
            const eventData = {
              ...eventResult.event,
              createdAt: new Date(eventResult.event.createdAt),
            };
            setEvent(eventData as DiaryEvent);
          } else {
            throw new Error('No se encontró el recuerdo.');
          }

          const contentResult = await getEventContentAction(id);
          if (contentResult.error) throw new Error(contentResult.error);
          setContent(contentResult.content || []);

        } catch (err: any) {
          setError(err.message);
          toast({
            variant: 'destructive',
            title: 'Error al cargar el recuerdo',
            description: err.message,
          });
          router.push('/');
        } finally {
          setLoading(false);
        }
      };

      fetchEventData();
    } else {
        router.push('/');
    }
  }, [id, router, toast]);

  const handleAddOptimisticContent = (item: EventContent) => {
    startTransition(() => {
      setOptimisticContent(item);
    });
  };

  const handleContentAdded = async () => {
     if (id) {
        const contentResult = await getEventContentAction(id);
        if (contentResult.error) {
            toast({ variant: 'destructive', title: 'Error', description: contentResult.error });
        } else {
            setContent(contentResult.content || []);
        }
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    
    startDeleteTransition(async () => {
        try {
            const result = await deleteEventAction({ id: event.id, imagePath: event.imagePath });
            if (result?.error) {
                throw new Error(result.error);
            }
            toast({
                title: "Recuerdo eliminado",
                description: "El momento ha sido eliminado para siempre de vuestro diario.",
            });
            // The server action will handle the redirect
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "No se pudo eliminar el recuerdo.";
            toast({
                variant: "destructive",
                title: "Error al eliminar",
                description: errorMessage,
            });
        }
    });
  };

  if (loading) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 w-full flex items-center justify-center">
                <LoadingSpinner />
            </main>
        </div>
    );
  }

  if (error || !event) {
    return null; // The user will be redirected by the effect hook
  }
  
  return (
    <div className="flex flex-col min-h-screen">
       <AddTextDialog
        isOpen={isTextDialogOpen}
        setIsOpen={setTextDialogOpen}
        eventId={id}
        onTextAdded={handleContentAdded}
        addOptimisticContent={handleAddOptimisticContent}
       />
        <AddImageDialog
            isOpen={isImageDialogOpen}
            setIsOpen={setImageDialogOpen}
            eventId={id}
            onImageAdded={handleContentAdded}
            addOptimisticContent={handleAddOptimisticContent}
        />

       <Header />
       <main className="flex-1 w-full">
        <div className="relative aspect-[4/3] md:aspect-video w-full">
            <Image
                src={event.imageUrl}
                alt={event.title}
                fill
                className="object-cover"
                priority
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
                <h1 className="text-4xl md:text-6xl font-headline font-bold text-white text-center drop-shadow-lg">
                    {event.title}
                </h1>
            </div>
             <div className="absolute top-4 left-4">
                <Button variant="ghost" onClick={() => router.back()} className="bg-black/20 text-white hover:bg-black/50 hover:text-white">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                </Button>
            </div>
            <div className="absolute top-4 right-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="bg-destructive/80 hover:bg-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar Recuerdo
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente el recuerdo y todo su contenido asociado (fotos y textos).
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
                        Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
        </div>
        
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <div className="flex justify-center items-center gap-4 my-8 p-6 bg-muted rounded-lg border-2 border-dashed">
                 <Button variant="outline" size="lg" onClick={() => setImageDialogOpen(true)}>
                    <ImagePlus className="mr-2"/>
                    Añadir Foto
                </Button>
                <Button variant="outline" size="lg" onClick={() => setTextDialogOpen(true)}>
                    <FileText className="mr-2"/>
                    Añadir Texto
                </Button>
            </div>
            
            <div className="space-y-8">
                 {optimisticContent.length === 0 && !loading && (
                    <div className="text-center py-16 text-muted-foreground">
                        <p>Comienza a construir este recuerdo...</p>
                        <p className="text-sm">Añade fotos y textos para contar la historia completa.</p>
                    </div>
                 )}

                 {optimisticContent.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).map((item) => (
                    <div key={item.id}>
                        {item.type === 'text' && (
                            <div className="p-6 bg-secondary rounded-lg shadow-sm">
                                <p className="text-secondary-foreground whitespace-pre-wrap">{item.value}</p>
                            </div>
                        )}
                        {item.type === 'image' && (
                            <div className="w-full aspect-[4/3] relative rounded-lg overflow-hidden shadow-lg">
                                <Image src={item.value} alt="Recuerdo" fill className="object-cover" />
                            </div>
                        )}
                         <p className="text-xs text-muted-foreground mt-2 text-right">
                            {format(item.createdAt, "d 'de' MMMM, HH:mm", { locale: es })}
                        </p>
                    </div>
                 ))}
            </div>

        </div>
      </main>
    </div>
  );
}
