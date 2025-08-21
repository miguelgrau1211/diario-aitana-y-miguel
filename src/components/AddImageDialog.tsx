
'use client';

import { useState, useRef } from 'react';
import ReactCrop, { type Crop, centerCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

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

function getCroppedImg(image: HTMLImageElement, crop: Crop): Promise<string> {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');
  
    if (!ctx) {
      return Promise.reject(new Error('Failed to get canvas context.'));
    }
  
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = crop.width * pixelRatio;
    canvas.height = crop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';
  
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );
  
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          const reader = new FileReader();
          reader.addEventListener('load', () => resolve(reader.result as string));
          reader.addEventListener('error', (error) => reject(error));
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        0.95
      );
    });
}

export function AddImageDialog({ isOpen, setIsOpen, eventId, onImageAdded, addOptimisticContent }: AddImageDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const imageRef = useRef<HTMLImageElement>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageSrc(null);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop: Crop = {
      unit: '%',
      width: 90,
      height: 90,
      x: 5,
      y: 5
    };
    const crop = centerCrop(initialCrop, width, height);
    setCrop(crop);
    setCompletedCrop(crop);
  };
  
  const handleCropConfirm = async () => {
    if (completedCrop && imageRef.current) {
        try {
            const croppedImageBase64 = await getCroppedImg(imageRef.current, completedCrop);
            setCroppedImage(croppedImageBase64);
            setImageSrc(null); // Close the cropper view
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error al recortar', description: 'No se pudo procesar la imagen.' });
        }
    }
  }

  const handleSubmit = async () => {
    if (!croppedImage) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se ha recortado ninguna imagen.' });
        return;
    }

    setIsSubmitting(true);
    
    addOptimisticContent({
        id: `optimistic-${Date.now()}`,
        type: 'image',
        value: croppedImage,
        createdAt: new Date(),
        imagePath: null,
    });
    handleCloseDialog(false);

    try {
      const result = await addImageContentAction({ eventId, imageBase64: croppedImage });
      
      if (result.error) throw new Error(result.error);
      
      toast({
        title: '¡Imagen añadida!',
        description: 'Una nueva foto ilumina este recuerdo.',
      });

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
            setImageSrc(null);
            setCroppedImage(null);
            setCrop(undefined);
            setCompletedCrop(undefined);
        }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className={imageSrc ? "max-w-3xl" : "max-w-lg"}>
        <DialogHeader>
          <DialogTitle>Añadir una nueva foto</DialogTitle>
          <DialogDescription>Sube y recorta una imagen que capture la esencia de este momento.</DialogDescription>
        </DialogHeader>
        
        {imageSrc ? (
             <div className="flex justify-center">
                 <ReactCrop
                    crop={crop}
                    onChange={c => setCrop(c)}
                    onComplete={c => setCompletedCrop(c)}
                    minWidth={100}
                    minHeight={100}
                    className="max-h-[70vh]"
                >
                    <img ref={imageRef} alt="Crop me" src={imageSrc} onLoad={onImageLoad} />
                </ReactCrop>
             </div>
        ) : (
            <div className="flex items-center justify-center w-full my-4">
                <label htmlFor="dropzone-file-dialog" className="flex flex-col items-center justify-center w-full aspect-[4/3] border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors relative overflow-hidden">
                    {croppedImage ? (
                        <Image src={croppedImage} alt="Vista previa recortada" fill className="object-cover" />
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
        )}

        <DialogFooter>
          {imageSrc ? (
            <>
                <Button variant="ghost" onClick={() => setImageSrc(null)}>Atrás</Button>
                <Button onClick={handleCropConfirm}>Confirmar Recorte</Button>
            </>
          ) : (
            <>
                <Button variant="ghost" onClick={() => handleCloseDialog(false)} disabled={isSubmitting}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting || !croppedImage}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Foto
                </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    