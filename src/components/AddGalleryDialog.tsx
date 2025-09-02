
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { CropDialog, type CroppedImageResult } from './CropDialog';

interface GalleryImageState extends CroppedImageResult {
    objectUrl: string;
}

interface AddGalleryDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSave: (images: { blob: Blob; width: number; height: number }[]) => void;
  isSaving: boolean;
}

export function AddGalleryDialog({ isOpen, setIsOpen, onSave, isSaving }: AddGalleryDialogProps) {
  const [croppedImages, setCroppedImages] = useState<GalleryImageState[]>([]);
  const { toast } = useToast();
  
  const [imagesToCrop, setImagesToCrop] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const files = Array.from(e.target.files);
        const remainingSlots = 4 - croppedImages.length;
        
        if (files.length === 0) return;

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
            setImagesToCrop(prev => [...prev, ...base64Images.filter(Boolean)]);
        }).catch(err => {
            toast({ variant: 'destructive', title: 'Error al leer archivos', description: 'Algunas imágenes no se pudieron procesar.' });
        });

        e.target.value = '';
    }
  };
  
  const removeImage = (index: number) => {
    setCroppedImages(prev => prev.filter((_, i) => i !== index));
  }

  const handleCropConfirm = (result: CroppedImageResult | null) => {
    if (result) {
        setCroppedImages(prev => [...prev, { ...result, objectUrl: result.objectUrl }]);
    }
    // Remove the processed image and move to the next, if any
    setImagesToCrop(prev => prev.slice(1));
  };

  const handleSubmit = () => {
    if (croppedImages.length < 2) {
        toast({ variant: 'destructive', title: 'Imágenes insuficientes', description: 'Una galería debe tener al menos 2 imágenes.' });
        return;
    }
    onSave(croppedImages.map(img => ({ blob: img.blob, width: img.width, height: img.height })));
    setIsOpen(false);
  };
  
  const handleCloseDialog = (open: boolean) => {
    if (!isSaving) {
        setIsOpen(open);
        if (!open) {
            setCroppedImages([]);
            setImagesToCrop([]);
        }
    }
  };
  
  const currentImageToCrop = useMemo(() => imagesToCrop[0] || null, [imagesToCrop]);

  useEffect(() => {
    return () => {
        croppedImages.forEach(image => URL.revokeObjectURL(image.objectUrl));
    }
  }, [croppedImages]);

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
      <DialogContent className="max-w-2xl flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Añadir una nueva galería</DialogTitle>
          <DialogDescription>Sube entre 2 y 4 fotos. Podrás recortar cada una de ellas.</DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4 max-h-[50vh] overflow-y-auto pr-2">
                {croppedImages.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                        <Image src={img.objectUrl} alt={`Previsualización ${index+1}`} width={img.width} height={img.height} className="object-cover w-full h-full" />
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
        </div>

        <DialogFooter className="mt-auto">
            <Button variant="ghost" onClick={() => handleCloseDialog(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isSaving || croppedImages.length < 2}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Galería
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
