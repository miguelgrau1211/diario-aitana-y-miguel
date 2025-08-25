
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DiaryEvent } from '@/types';
import { Header } from '@/components/Header';
import { Input } from '@/components/ui/input';
import { EventCard } from '@/components/EventCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PasswordProtect } from '@/components/PasswordProtect';

export default function Home() {
  const [events, setEvents] = useState<DiaryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('isAuthenticated') === 'true') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const eventsData: DiaryEvent[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        eventsData.push({ 
          id: doc.id,
          title: data.title,
          description: data.description,
          imageUrl: data.imageUrl,
          imagePath: data.imagePath,
          createdAt: (data.createdAt as Timestamp).toDate(),
          width: data.width,
          height: data.height,
        });
      });
      setEvents(eventsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const handleAuthenticated = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('isAuthenticated', 'true');
    }
    setIsAuthenticated(true);
  };

  const filteredEvents = useMemo(() => {
    if (!searchQuery) {
      return events;
    }
    return events.filter((event) => {
      const eventDate = format(event.createdAt, "d 'de' MMMM 'de' yyyy", { locale: es });
      return (
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eventDate.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [events, searchQuery]);

  if (!isAuthenticated) {
    return <PasswordProtect onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por título o fecha..."
              className="pl-10 w-full md:w-1/2 bg-background/80"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold mb-2">No hay recuerdos aún</h2>
            <p className="text-muted-foreground mb-4">¡Empieza a documentartu historia de amor!</p>
            <Button asChild>
              <Link href="/add-event">
                <Plus className="mr-2 h-4 w-4" />
                Crear primer recuerdo
              </Link>
            </Button>
          </div>
        )}
      </main>
      <div className="md:hidden fixed bottom-6 right-6 z-20">
        <Button asChild size="icon" className="rounded-full w-14 h-14 shadow-lg">
          <Link href="/add-event">
            <Plus className="h-6 w-6" />
            <span className="sr-only">Añadir Recuerdo</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
