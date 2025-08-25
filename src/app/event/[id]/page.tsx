
'use client';

import { useEffect, useState, useOptimistic, startTransition, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { DiaryEvent, EventContent, TextContent, ImageContent, GalleryContent, ImageTextContent } from '@/types';
import { getEventAction, getEventContentAction, deleteEventAction, deleteContentAction } from './actions';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, Loader2, Pencil } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { AddTextDialog } from '@/components/AddTextDialog';
import { AddImageDialog } from '@/components/AddImageDialog';
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
import { AddContentControl } from '@/components/AddContentControl';
import { cn } from '@/lib/utils';
import { AddGalleryDialog } from '@/components/AddGalleryDialog';
import { AddImageTextDialog } from '@/components/AddImageTextDialog';


type OptimisticUpdate = {
  item: EventContent;
  type: 'add' | 'remove';
};

function optimisticContentReducer(
  state: EventContent[],
  update: OptimisticUpdate
): EventContent[] {
  switch (update.type) {
    case 'add':
      return [...state, update.item];
    case 'remove':
      return state.filter(item => item.id !== update.item.id);
    default:
      return state;
  }
}

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const [event, setEvent] = useState<DiaryEvent | null>(null);
  const [content, setContent] = useState<EventContent[]>([]);

  const [optimisticContent, setOptimisticContent] = useOptimistic(
    content,
    optimisticContentReducer
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeletingEvent, startDeleteEventTransition] = useTransition();

  const [isTextDialogOpen, setTextDialogOpen] = useState(false);
  const [isImageDialogOpen, setImageDialogOpen] = useState(false);
  const [isGalleryDialogOpen, setGalleryDialogOpen] = useState(false);
  const [isImageTextDialogOpen, setImageTextDialogOpen] = useState(false);
  
  const [isContentActionPending, startContentActionTransition] = useTransition();

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

  const handleEventDelete = async () => {
    if (!event) return;
    
    startDeleteEventTransition(async () => {
        try {
            const result = await deleteEventAction({ id: event.id, imagePath: event.imagePath });
            if (result?.error) {
                throw new Error(result.error);
            }
            toast({
                title: "Recuerdo eliminado",
                description: "El momento ha sido eliminado para siempre de vuestro diario.",
            });
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

  const handleContentDelete = async (itemToDelete: EventContent) => {
    startContentActionTransition(async () => {
      setOptimisticContent({ item: itemToDelete, type: 'remove' });

      let imagePaths: string[] = [];
      if (itemToDelete.type === 'image') {
          imagePaths = [itemToDelete.imagePath];
      } else if (itemToDelete.type === 'gallery') {
          imagePaths = itemToDelete.images.map(img => img.imagePath);
      } else if (itemToDelete.type === 'imageText') {
          imagePaths = [itemToDelete.imagePath];
      }
      
      const result = await deleteContentAction({
        eventId: id,
        contentId: itemToDelete.id,
        contentType: itemToDelete.type,
        imagePaths: imagePaths
      });

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error al eliminar contenido',
          description: result.error,
        });
        // Revert optimistic update on failure
        await handleContentAdded();
      } else {
        toast({
          title: 'Contenido eliminado',
        });
        // Sync server state with optimistic state
        setContent(current => current.filter(item => item.id !== itemToDelete.id));
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
  
  const renderContentItem = (item: EventContent) => {
    const contentControls = (
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon" className="h-8 w-8">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Seguro que quieres eliminar esto?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción es irreversible y eliminará este contenido del recuerdo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isContentActionPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleContentDelete(item)}
                disabled={isContentActionPending}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isContentActionPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );

    switch(item.type) {
      case 'text':
        return (
          <div className="p-6 bg-secondary rounded-lg shadow-sm">
            <p className="text-secondary-foreground whitespace-pre-wrap">{item.value}</p>
          </div>
        );
      case 'image':
        return (
          <div className="w-full relative rounded-lg overflow-hidden shadow-lg">
             {contentControls}
            {item.width && item.height ? (
                <Image 
                    src={item.value} 
                    alt="Recuerdo" 
                    width={item.width}
                    height={item.height}
                    className="object-cover w-full h-auto"
                />
            ) : (
                <div className="aspect-[4/3] w-full relative">
                    <Image
                        src={item.value}
                        alt="Recuerdo"
                        fill
                        className="object-cover"
                    />
                </div>
            )}
          </div>
        );
      case 'gallery':
        return (
            <div className="relative">
              {contentControls}
              <div className="flex gap-2 rounded-lg overflow-hidden shadow-lg">
                  {item.images.map((img, index) => (
                      <div key={index} className="relative flex-1" style={{aspectRatio: `${img.width} / ${img.height}`}}>
                          <Image 
                              src={img.value}
                              alt={`Galería de recuerdos ${index + 1}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 50vw, 33vw"
                          />
                      </div>
                  ))}
              </div>
            </div>
        );
      case 'imageText':
        return (
            <div className="relative bg-secondary rounded-lg shadow-sm overflow-hidden">
                {contentControls}
                <div className={cn(
                    "grid grid-cols-1 md:grid-cols-2 gap-6 items-center",
                    item.imagePosition === 'right' && "md:grid-flow-col-dense"
                )}>
                    <div className={cn("relative w-full h-full", item.imagePosition === 'right' && 'md:col-start-2')}>
                        <Image
                            src={item.imageUrl}
                            alt="Recuerdo con texto"
                            width={item.width}
                            height={item.height}
                            className="object-cover w-full h-full"
                        />
                    </div>
                    <div className="p-6">
                        <p className="text-secondary-foreground whitespace-pre-wrap">{item.text}</p>
                    </div>
                </div>
            </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
       <AddTextDialog
        isOpen={isTextDialogOpen}
        setIsOpen={setTextDialogOpen}
        eventId={id}
        onTextAdded={handleContentAdded}
        addOptimisticContent={(item) => setOptimisticContent({ item, type: 'add' })}
       />
        <AddImageDialog
            isOpen={isImageDialogOpen}
            setIsOpen={setImageDialogOpen}
            eventId={id}
            onImageAdded={handleContentAdded}
            addOptimisticContent={(item) => setOptimisticContent({ item, type: 'add' })}
        />
        <AddGalleryDialog
            isOpen={isGalleryDialogOpen}
            setIsOpen={setGalleryDialogOpen}
            eventId={id}
            onGalleryAdded={handleContentAdded}
            addOptimisticContent={(item) => setOptimisticContent({ item, type: 'add' })}
        />
        <AddImageTextDialog
            isOpen={isImageTextDialogOpen}
            setIsOpen={setImageTextDialogOpen}
            eventId={id}
            onImageTextAdded={handleContentAdded}
            addOptimisticContent={(item) => setOptimisticContent({ item, type: 'add' })}
        />

       <Header />
       <main className="flex-1 w-full">
        <div className="relative h-64 md:h-96 w-full">
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
                        <AlertDialogTitle>¿Estás absolutely seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente el recuerdo y todo su contenido asociado (fotos y textos).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeletingEvent}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                        onClick={handleEventDelete}
                        disabled={isDeletingEvent}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                        {isDeletingEvent ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
        </div>
        
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <AddContentControl 
              onAddImage={() => setImageDialogOpen(true)}
              onAddText={() => setTextDialogOpen(true)}
              onAddGallery={() => setGalleryDialogOpen(true)}
              onAddImageText={() => setImageTextDialogOpen(true)}
            />
            
            <div className="space-y-8 mt-8">
                 {optimisticContent.length === 0 && !loading && (
                    <div className="text-center py-16 text-muted-foreground">
                        <p>Comienza a construir este recuerdo...</p>
                        <p className="text-sm">Añade fotos y textos para contar la historia completa.</p>
                    </div>
                 )}

                 {optimisticContent.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((item) => (
                    <div key={item.id} className="relative group">
                        {renderContentItem(item)}
                    </div>
                 ))}
            </div>

        </div>
      </main>
    </div>
  );
}
