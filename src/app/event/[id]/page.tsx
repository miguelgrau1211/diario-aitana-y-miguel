
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { DiaryEvent } from '@/types';
import { getEventAction } from '@/app/add-event/actions';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ImagePlus, FileText } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [event, setEvent] = useState<DiaryEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (id) {
      const fetchEvent = async () => {
        setLoading(true);
        setError(null);
        try {
          const result = await getEventAction(id);
          if (result.error) {
            throw new Error(result.error);
          }
          if (result.event) {
            const eventData = {
              ...result.event,
              createdAt: new Date(result.event.createdAt),
            };
            setEvent(eventData as DiaryEvent);
          } else {
            throw new Error('No se encontró el recuerdo.');
          }
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

      fetchEvent();
    } else {
        router.push('/');
    }
  }, [id, router, toast]);

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
       <Header />
       <main className="flex-1 w-full">
        <div className="relative h-64 md:h-80 w-full">
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
        </div>
        
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <div className="flex justify-center items-center gap-4 my-8 p-6 bg-muted rounded-lg border-2 border-dashed">
                 <Button variant="outline" size="lg">
                    <ImagePlus className="mr-2"/>
                    Añadir Foto
                </Button>
                <Button variant="outline" size="lg">
                    <FileText className="mr-2"/>
                    Añadir Texto
                </Button>
            </div>
            
            {/* Aquí se mostrará el contenido del recuerdo (fotos, textos, etc.) */}
            <div className="space-y-8">
                 <div className="text-center py-16 text-muted-foreground">
                    <p>Comienza a construir este recuerdo...</p>
                    <p className="text-sm">Añade fotos y textos para contar la historia completa.</p>
                </div>
            </div>

        </div>
      </main>
    </div>
  );
}
