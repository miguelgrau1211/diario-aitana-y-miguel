import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-40 w-full border-b">
      <div className="max-w-5xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-2xl font-bold font-headline" style={{ color: 'hsl(var(--primary))' }}>
          Amor Diario
        </Link>
        <Button asChild className="hidden md:flex">
          <Link href="/add-event">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Recuerdo
          </Link>
        </Button>
      </div>
    </header>
  );
}
