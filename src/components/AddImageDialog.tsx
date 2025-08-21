
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

interface CroppedImageResult {
    base64: string;
    width: number;
    height: number;
}


function getCroppedImg(image: HTMLImageElement, crop: Crop): Promise<CroppedImageResult> {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    const cropWidth = Math.floor(crop.width * scaleX);
    const cropHeight = Math.floor(crop.height * scaleY);
    
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const ctx = canvas.getContext('2d');
  
    if (!ctx) {
      return Promise.reject(new Error('Failed to get canvas context.'));
    }
  
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );
  
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          const reader = new FileReader();
          reader.addEventListener('load', () => resolve({
              base64: reader.result as string,
              width: cropWidth,
              height: cropHeight,
          }));
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
  const [croppedImageResult, setCroppedImageResult] = useState<CroppedImageResult | null>(null);
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
            const result = await getCroppedImg(imageRef.current, completedCrop);
            setCroppedImageResult(result);
            setImageSrc(null); // Close the cropper view
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error al recortar', description: 'No se pudo procesar la imagen.' });
        }
    }
  }

  const handleSubmit = async () => {
    if (!croppedImageResult) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se ha recortado ninguna imagen.' });
        return;
    }

    setIsSubmitting(true);
    
    addOptimisticContent({
        id: `optimistic-${Date.now()}`,
        type: 'image',
        value: croppedImageResult.base64,
        createdAt: new Date(),
        imagePath: null,
        width: croppedImageResult.width,
        height: croppedImageResult.height,
    });
    handleCloseDialog(false);

    try {
      const result = await addImageContentAction({ 
          eventId, 
          imageBase64: croppedImageResult.base64,
          width: croppedImageResult.width,
          height: croppedImageResult.height,
      });
      
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
            setCroppedImageResult(null);
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
                <label htmlFor="dropzone-file-dialog" className="flex flex-col items-center justify-center w-full min-h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors relative overflow-hidden">
                    {croppedImageResult?.base64 ? (
                        <Image src={croppedImageResult.base64} alt="Vista previa recortada" layout="fill" className="object-contain" />
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
                <Button onClick={handleSubmit} disabled={isSubmitting || !croppedImageResult}>
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
