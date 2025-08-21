
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addGalleryContentAction } from '@/app/event/[id]/actions';
import { Loader2, Upload, X } from 'lucide-react';
import Image from 'next/image';
import type { EventContent, GalleryContent } from '@/types';

interface AddGalleryDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  eventId: string;
  onGalleryAdded: () => void;
  addOptimisticContent: (item: EventContent) => void;
}

interface ImagePreview {
    base64: string;
    width: number;
    height: number;
}

export function AddGalleryDialog({ isOpen, setIsOpen, eventId, onGalleryAdded, addOptimisticContent }: AddGalleryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const files = Array.from(e.target.files);
        if (images.length + files.length > 4) {
            toast({ variant: 'destructive', title: 'Límite alcanzado', description: 'Puedes subir un máximo de 4 imágenes por galería.' });
            return;
        }

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const img = document.createElement('img');
                img.onload = () => {
                    setImages(prev => [...prev, {
                        base64: loadEvent.target?.result as string,
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                    }]);
                };
                img.src = loadEvent.target?.result as string;
            };
            reader.readAsDataURL(file);
        });
    }
  };
  
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  const handleSubmit = async () => {
    if (images.length < 2) {
        toast({ variant: 'destructive', title: 'Imágenes insuficientes', description: 'Una galería debe tener al menos 2 imágenes.' });
        return;
    }

    setIsSubmitting(true);
    
    // Optimistic update
    addOptimisticContent({
        id: `optimistic-${Date.now()}`,
        type: 'gallery',
        createdAt: new Date(),
        images: images.map(img => ({
            value: img.base64,
            imagePath: '',
            width: img.width,
            height: img.height,
        })),
    });
    handleCloseDialog(false);

    try {
      const result = await addGalleryContentAction({ eventId, images });
      if (result.error) throw new Error(result.error);
      
      toast({
        title: '¡Galería añadida!',
        description: 'Vuestras fotos han sido añadidas al recuerdo.',
      });

      await onGalleryAdded();

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error al crear la galería', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleCloseDialog = (open: boolean) => {
    if (!isSubmitting) {
        setIsOpen(open);
        if (!open) {
            setImages([]);
        }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Añadir una nueva galería</DialogTitle>
          <DialogDescription>Sube entre 2 y 4 fotos para crear una composición.</DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
            {images.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                    <Image src={img.base64} alt={`Previsualización ${index+1}`} fill className="object-cover" />
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            {images.length < 4 && (
                <label htmlFor="gallery-upload" className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors">
                    <div className="flex flex-col items-center justify-center">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <span className="text-sm text-center text-muted-foreground">Añadir foto</span>
                    </div>
                    <Input id="gallery-upload" type="file" multiple className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
            )}
        </div>

        <DialogFooter>
            <Button variant="ghost" onClick={() => handleCloseDialog(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || images.length < 2}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Galería
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
