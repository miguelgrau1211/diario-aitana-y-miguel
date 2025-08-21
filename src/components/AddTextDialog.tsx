
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { addTextContentAction } from '@/app/event/[id]/actions';
import { Loader2 } from 'lucide-react';
import type { EventContent } from '@/types';

interface AddTextDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  eventId: string;
  onTextAdded: () => void;
  addOptimisticContent: (item: EventContent) => void;
}

export function AddTextDialog({ isOpen, setIsOpen, eventId, onTextAdded, addOptimisticContent }: AddTextDialogProps) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (text.trim().length < 5) {
      toast({
        variant: 'destructive',
        title: 'Texto demasiado corto',
        description: 'Por favor, escribe algo más significativo.',
      });
      return;
    }

    setIsSubmitting(true);

    addOptimisticContent({
      id: `optimistic-${Date.now()}`,
      type: 'text',
      value: text,
      createdAt: new Date(),
    });
    setIsOpen(false);

    try {
      const result = await addTextContentAction({ eventId, text });
      if (result.error) {
        throw new Error(result.error);
      }
      toast({
        title: '¡Texto añadido!',
        description: 'Tu nuevo texto forma parte de este recuerdo.',
      });
      setText('');
      await onTextAdded();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: error.message,
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleCloseDialog = (open: boolean) => {
    if (!isSubmitting) {
        setIsOpen(open);
        if (!open) setText('');
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir un nuevo texto</DialogTitle>
          <DialogDescription>Describe un sentimiento, una anécdota o cualquier detalle que quieras recordar.</DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Escribe aquí..."
          className="min-h-[150px] my-4"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isSubmitting}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Texto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
