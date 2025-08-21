
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { DiaryEvent } from '@/types';
import { getEventAction } from '@/app/add-event/actions';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import type { Timestamp } from 'firebase/firestore';

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
            setEvent(result.event);
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
  
  const eventDate = (event.createdAt as Timestamp).toDate();

  return (
    <div className="flex flex-col min-h-screen">
       <Header />
       <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a todos los recuerdos
          </Button>
        </div>
        <Card className="overflow-hidden">
          <CardHeader className="p-0">
             <div className="aspect-video relative w-full">
                <Image
                    src={event.imageUrl}
                    alt={event.title}
                    fill
                    className="object-cover"
                    priority
                />
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <CardTitle className="font-headline text-3xl md:text-4xl mb-4">{event.title}</CardTitle>
            <div className="flex items-center text-md text-muted-foreground mb-6">
                <Calendar className="mr-2 h-5 w-5" />
                <time dateTime={eventDate.toISOString()}>
                    {format(eventDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
                </time>
            </div>
            <div className="prose prose-lg max-w-none text-foreground whitespace-pre-wrap">
                {event.description}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
