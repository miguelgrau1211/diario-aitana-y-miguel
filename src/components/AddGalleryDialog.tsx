
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addGalleryContentAction } from '@/app/event/[id]/actions';
import { Loader2, Upload, X } from 'lucide-react';
import Image from 'next/image';
import type { EventContent } from '@/types';
import { CropDialog } from './CropDialog';

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
  const [croppedImages, setCroppedImages] = useState<ImagePreview[]>([]);
  const { toast } = useToast();
  
  const [imagesToCrop, setImagesToCrop] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const files = Array.from(e.target.files);
        const remainingSlots = 4 - croppedImages.length;
        if (files.length > remainingSlots) {
            toast({ variant: 'destructive', title: 'Límite alcanzado', description: `Puedes subir ${remainingSlots > 1 ? `hasta ${remainingSlots} imágenes más` : 'una imagen más'}.` });
        }

        const filePromises = files.slice(0, remainingSlots).map(file => {
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (loadEvent) => resolve(loadEvent.target?.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });

        Promise.all(filePromises).then(base64Images => {
            setImagesToCrop(prev => [...prev, ...base64Images]);
        });
    }
  };
  
  const removeImage = (index: number) => {
    setCroppedImages(prev => prev.filter((_, i) => i !== index));
  }

  const handleCropConfirm = (result: ImagePreview | null) => {
    if (result) {
        setCroppedImages(prev => [...prev, result]);
    }
    // Remove the processed image and move to the next, if any
    setImagesToCrop(prev => prev.slice(1));
  };

  const handleSubmit = async () => {
    if (croppedImages.length < 2) {
        toast({ variant: 'destructive', title: 'Imágenes insuficientes', description: 'Una galería debe tener al menos 2 imágenes.' });
        return;
    }

    setIsSubmitting(true);
    
    addOptimisticContent({
        id: `optimistic-${Date.now()}`,
        type: 'gallery',
        createdAt: new Date(),
        images: croppedImages.map(img => ({
            value: img.base64,
            imagePath: '',
            width: img.width,
            height: img.height,
        })),
    });
    handleCloseDialog(false);

    try {
      const result = await addGalleryContentAction({ eventId, images: croppedImages });
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
            setCroppedImages([]);
            setImagesToCrop([]);
        }
    }
  };
  
  const currentImageToCrop = useMemo(() => imagesToCrop[0] || null, [imagesToCrop]);

  return (
    <>
     {currentImageToCrop && (
        <CropDialog 
            imageSrc={currentImageToCrop}
            onConfirm={handleCropConfirm}
            showSkipButton={true}
        />
      )}
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Añadir una nueva galería</DialogTitle>
          <DialogDescription>Sube entre 2 y 4 fotos. Podrás recortar cada una de ellas.</DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
            {croppedImages.map((img, index) => (
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
            {croppedImages.length < 4 && (
                <label htmlFor="gallery-upload" className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors">
                    <div className="flex flex-col items-center justify-center">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <span className="text-sm text-center text-muted-foreground">Añadir foto(s)</span>
                    </div>
                    <Input id="gallery-upload" type="file" multiple className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
            )}
        </div>

        <DialogFooter>
            <Button variant="ghost" onClick={() => handleCloseDialog(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || croppedImages.length < 2}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Galería
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
