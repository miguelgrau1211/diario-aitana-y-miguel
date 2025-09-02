
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X } from 'lucide-react';
import { CropDialog, type CroppedImageResult } from './CropDialog';

export interface GalleryImageState extends CroppedImageResult {
    objectUrl: string;
}

interface AddGalleryDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSave: (images: GalleryImageState[]) => void;
  isSaving: boolean;
}

export function AddGalleryDialog({ isOpen, setIsOpen, onSave, isSaving }: AddGalleryDialogProps) {
  const [croppedImages, setCroppedImages] = useState<GalleryImageState[]>([]);
  const { toast } = useToast();
  
  const [filesToCrop, setFilesToCrop] = useState<File[]>([]);
  const [currentCropImageSrc, setCurrentCropImageSrc] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const newFiles = Array.from(e.target.files);
        const remainingSlots = 4 - croppedImages.length;
        
        if (newFiles.length === 0) return;

        if (newFiles.length > remainingSlots) {
            toast({ variant: 'destructive', title: 'Límite alcanzado', description: `Puedes subir ${remainingSlots > 1 ? `hasta ${remainingSlots} imágenes más` : 'una imagen más'}.` });
        }
        
        // Add new files to the queue
        setFilesToCrop(prev => [...prev, ...newFiles.slice(0, remainingSlots)]);
        
        e.target.value = ''; // Reset input to allow re-selecting
    }
  };

  // Effect to process the queue of files to be cropped
  useEffect(() => {
    if (filesToCrop.length > 0 && !currentCropImageSrc) {
        const nextFile = filesToCrop[0];
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            setCurrentCropImageSrc(loadEvent.target?.result as string);
        };
        reader.readAsDataURL(nextFile);
    }
  }, [filesToCrop, currentCropImageSrc]);
  
  const removeImage = (index: number) => {
    const imageToRemove = croppedImages[index];
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.objectUrl);
    }
    setCroppedImages(prev => prev.filter((_, i) => i !== index));
  }

  const handleCropConfirm = (result: CroppedImageResult | null) => {
    if (result) {
        setCroppedImages(prev => [...prev, { ...result, objectUrl: result.objectUrl }]);
    }
    
    // Remove the processed image from the queue and reset the crop dialog src
    setFilesToCrop(prev => prev.slice(1));
    setCurrentCropImageSrc(null);
  };

  const handleSubmit = () => {
    if (croppedImages.length < 2) {
        toast({ variant: 'destructive', title: 'Imágenes insuficientes', description: 'Una galería debe tener al menos 2 imágenes.' });
        return;
    }
    onSave(croppedImages);
    setIsOpen(false);
  };
  
  const handleCloseDialog = (open: boolean) => {
    if (!isSaving) {
        setIsOpen(open);
        if (!open) {
            croppedImages.forEach(image => URL.revokeObjectURL(image.objectUrl));
            setCroppedImages([]);
            setFilesToCrop([]);
            setCurrentCropImageSrc(null);
        }
    }
  };

  useEffect(() => {
    return () => {
        croppedImages.forEach(image => URL.revokeObjectURL(image.objectUrl));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
     {currentCropImageSrc && (
        <CropDialog 
            imageSrc={currentCropImageSrc}
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
                    <div key={img.objectUrl} className="relative aspect-square rounded-lg overflow-hidden group">
                        <img src={img.objectUrl} alt={`Previsualización ${index+1}`} className="object-cover w-full h-full" />
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
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

        <DialogFooter className="mt-auto pt-4 border-t">
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
