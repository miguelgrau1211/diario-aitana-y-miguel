
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addImageContentAction } from '@/app/event/[id]/actions';
import { Loader2, Upload } from 'lucide-react';
import Image from 'next/image';
import type { EventContent } from '@/types';

interface AddImageDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  eventId: string;
  onImageAdded: () => void;
  addOptimisticContent: (item: EventContent) => void;
}

export function AddImageDialog({ isOpen, setIsOpen, eventId, onImageAdded, addOptimisticContent }: AddImageDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
  };

  const handleSubmit = async () => {
    if (!previewImage) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se ha seleccionado ninguna imagen.' });
        return;
    }

    setIsSubmitting(true);
    
    // Optimistic update
    addOptimisticContent({
        id: `optimistic-${Date.now()}`,
        type: 'image',
        value: previewImage,
        createdAt: new Date(),
        imagePath: null,
    });
    setIsOpen(false);

    try {
      const result = await addImageContentAction({ eventId, imageBase64: previewImage });
      
      if (result.error) throw new Error(result.error);
      
      toast({
        title: '¡Imagen añadida!',
        description: 'Una nueva foto ilumina este recuerdo.',
      });

      setPreviewImage(null);
      await onImageAdded();

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error al subir la imagen', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleCloseDialog = (open: boolean) => {
    if (!isSubmitting) {
        setIsOpen(open);
        if (!open) {
            setPreviewImage(null);
        }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir una nueva foto</DialogTitle>
          <DialogDescription>Sube una imagen que capture la esencia de este momento.</DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center justify-center w-full my-4">
            <label htmlFor="dropzone-file-dialog" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors">
                {previewImage ? (
                    <Image src={previewImage} alt="Vista previa" width={200} height={200} className="object-contain h-full p-2" />
                ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Haz clic para subir</span> o arrastra y suelta</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF o WEBP</p>
                    </div>
                )}
                <Input id="dropzone-file-dialog" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleCloseDialog(false)} disabled={isSubmitting}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !previewImage}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Foto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
