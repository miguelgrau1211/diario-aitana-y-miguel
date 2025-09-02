
'use client';

import { useEffect, useState, useOptimistic, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { DiaryEvent, EventContent, TextContent, ImageContent, GalleryContent, ImageTextContent, GalleryImage } from '@/types';
import { 
    getEventAction, 
    getEventContentAction, 
    deleteEventAction, 
    deleteContentAction,
    addTextContentAction,
    addImageContentAction,
    addGalleryContentAction,
    addImageTextContentAction,
} from './actions';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, Loader2, Pencil, GalleryThumbnails } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { AddTextDialog } from '@/components/AddTextDialog';
import { AddImageDialog, type CroppedImageResult } from '@/components/AddImageDialog';
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
import { AddGalleryDialog, type GalleryImageState } from '@/components/AddGalleryDialog';
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
      if (state.find(item => item.id === update.item.id)) {
        return state;
      }
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

  const syncContent = async () => {
     if (id) {
        const contentResult = await getEventContentAction(id);
        if (contentResult.error) {
            toast({ variant: 'destructive', title: 'Error', description: contentResult.error });
            setContent(current => {
              // Manually revert optimistic update
              setOptimisticContent({ type: 'add', item: current[current.length-1]});
              return current;
            });
        } else {
            setContent(contentResult.content || []);
        }
    }
  };

  const handleTextSubmit = (text: string) => {
    startContentActionTransition(async () => {
      const optimisticItem: TextContent = {
        id: `optimistic-${Date.now()}`,
        type: 'text',
        value: text,
        createdAt: new Date(),
      };
      setOptimisticContent({ item: optimisticItem, type: 'add' });
      
      const result = await addTextContentAction({ eventId: id, text });
      if (result.error) {
        toast({ variant: 'destructive', title: 'Error al guardar', description: result.error });
      } else {
        toast({ title: '¡Texto añadido!', description: 'Tu nuevo texto forma parte de este recuerdo.' });
      }
      await syncContent();
    });
  };

  const handleImageSubmit = (imageData: CroppedImageResult) => {
    startContentActionTransition(async () => {
        const optimisticItem: ImageContent = {
            id: `optimistic-${Date.now()}`,
            type: 'image',
            value: imageData.objectUrl,
            createdAt: new Date(),
            imagePath: '',
            width: imageData.width,
            height: imageData.height,
        };
        setOptimisticContent({ item: optimisticItem, type: 'add' });

        const result = await addImageContentAction({ eventId: id, imageBlob: imageData.blob, width: imageData.width, height: imageData.height });
        if (result.error) {
            toast({ variant: 'destructive', title: 'Error al subir la imagen', description: result.error });
        } else {
            toast({ title: '¡Imagen añadida!', description: 'Una nueva foto ilumina este recuerdo.' });
        }
        await syncContent();
    });
  };

  const handleGallerySubmit = (images: GalleryImageState[]) => {
    startContentActionTransition(async () => {
        const optimisticItem: GalleryContent = {
            id: `optimistic-${Date.now()}`,
            type: 'gallery',
            createdAt: new Date(),
            images: images.map(img => ({
                value: img.objectUrl, // Use the preview URL for optimistic update
                imagePath: '',
                width: img.width,
                height: img.height,
            })),
        };
        setOptimisticContent({ item: optimisticItem, type: 'add' });
        setGalleryDialogOpen(false); // Close dialog *after* optimistic update

        const imagePayloads = await Promise.all(
            images.map(async (img) => {
                const buffer = await img.blob.arrayBuffer();
                return {
                    buffer: Buffer.from(buffer),
                    width: img.width,
                    height: img.height,
                    contentType: img.blob.type,
                };
            })
        );
        
        const result = await addGalleryContentAction({ eventId: id, images: imagePayloads });

        if (result.error) {
            toast({ variant: 'destructive', title: 'Error al crear la galería', description: result.error });
        } else {
            toast({ title: '¡Galería añadida!', description: 'Vuestras fotos han sido añadidas al recuerdo.' });
        }
        await syncContent();
    });
};

  const handleImageTextSubmit = (data: { image: CroppedImageResult; text: string; position: 'left' | 'right' }) => {
     startContentActionTransition(async () => {
        const optimisticItem: ImageTextContent = {
            id: `optimistic-${Date.now()}`,
            type: 'imageText',
            createdAt: new Date(),
            imageUrl: data.image.objectUrl,
            imagePath: '',
            width: data.image.width,
            height: data.image.height,
            text: data.text,
            imagePosition: data.position,
        };
        setOptimisticContent({ item: optimisticItem, type: 'add' });

        const result = await addImageTextContentAction({
            eventId: id,
            imageBlob: data.image.blob,
            width: data.image.width,
            height: data.image.height,
            text: data.text,
            imagePosition: data.position,
        });

        if (result.error) {
            toast({ variant: 'destructive', title: 'Error al guardar', description: result.error });
        } else {
            toast({ title: '¡Contenido añadido!', description: 'La combinación de imagen y texto se ha guardado.' });
        }
        await syncContent();
     });
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
      const optimisticItem = { ...itemToDelete, id: itemToDelete.id || `optimistic-delete-${Date.now()}` };
      setOptimisticContent({ item: optimisticItem, type: 'remove' });

      let imagePaths: string[] = [];
      if (itemToDelete.type === 'image' && itemToDelete.imagePath) {
          imagePaths = [itemToDelete.imagePath];
      } else if (itemToDelete.type === 'gallery') {
          imagePaths = itemToDelete.images.map(img => img.imagePath).filter(Boolean);
      } else if (itemToDelete.type === 'imageText' && itemToDelete.imagePath) {
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
        setOptimisticContent({item: optimisticItem, type: 'add'});
      } else {
        toast({
          title: 'Contenido eliminado',
        });
        syncContent();
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
          <div className="p-6 bg-secondary rounded-lg shadow-sm relative group">
             {contentControls}
            <p className="text-secondary-foreground whitespace-pre-wrap">{item.value}</p>
          </div>
        );
      case 'image':
        return (
          <div className="w-full relative rounded-lg overflow-hidden shadow-lg group">
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
      case 'gallery': {
        const imageCount = item.images.length;
        const gridClasses = {
            1: 'grid-cols-1',
            2: 'grid-cols-2',
            3: 'grid-cols-3',
            default: 'grid-cols-2 md:grid-cols-4',
        };
        const gridClass = imageCount <= 3 ? gridClasses[imageCount as keyof typeof gridClasses] : gridClasses.default;

        return (
            <div className="relative group">
              {contentControls}
              <div className={cn("grid gap-2 rounded-lg overflow-hidden", gridClass)}>
                  {item.images.map((img, index) => (
                      <div key={index} className="relative w-full" style={{aspectRatio: `${img.width} / ${img.height}`}}>
                          {img.value && (
                            <Image 
                                src={img.value}
                                alt={`Galería de recuerdos ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                            />
                          )}
                      </div>
                  ))}
              </div>
            </div>
        );
      }
      case 'imageText':
        return (
            <div className="relative bg-secondary rounded-lg shadow-sm overflow-hidden group">
                {contentControls}
                <div className={cn(
                    "grid grid-cols-1 md:grid-cols-2 gap-6 items-center",
                    item.imagePosition === 'right' && "md:grid-flow-col-dense"
                )}>
                    <div className={cn("relative w-full h-full min-h-[200px]", item.imagePosition === 'right' && 'md:col-start-2')}>
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
        onSave={handleTextSubmit}
        isSaving={isContentActionPending}
       />
        <AddImageDialog
            isOpen={isImageDialogOpen}
            setIsOpen={setImageDialogOpen}
            onSave={handleImageSubmit}
            isSaving={isContentActionPending}
        />
        <AddGalleryDialog
            isOpen={isGalleryDialogOpen}
            setIsOpen={setGalleryDialogOpen}
            onSave={handleGallerySubmit}
            isSaving={isContentActionPending}
        />
        <AddImageTextDialog
            isOpen={isImageTextDialogOpen}
            setIsOpen={setImageTextDialogOpen}
            onSave={handleImageTextSubmit}
            isSaving={isContentActionPending}
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
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="bg-destructive/80 hover:bg-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
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
                    <div key={item.id} className="relative">
                        {renderContentItem(item)}
                    </div>
                 ))}
            </div>

        </div>
      </main>
    </div>
  );
}
