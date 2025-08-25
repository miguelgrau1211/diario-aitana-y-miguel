
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AddTextDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSave: (text: string) => void;
  isSaving: boolean;
}

export function AddTextDialog({ isOpen, setIsOpen, onSave, isSaving }: AddTextDialogProps) {
  const [text, setText] = useState('');
  const { toast } = useToast();

  const handleSubmit = () => {
    if (text.trim().length < 5) {
      toast({
        variant: 'destructive',
        title: 'Texto demasiado corto',
        description: 'Por favor, escribe algo más significativo.',
      });
      return;
    }
    onSave(text);
    setIsOpen(false);
  };

  const handleCloseDialog = (open: boolean) => {
    if (!isSaving) {
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
          disabled={isSaving}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => handleCloseDialog(false)} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSaving || text.trim().length < 5}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Texto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
