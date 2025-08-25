
'use client';

import { useState, useRef } from 'react';
import ReactCrop, { type Crop, centerCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const MAX_IMAGE_DIMENSION = 1920; // Max width/height of 1920px

export interface CroppedImageResult {
    blob: Blob;
    objectUrl: string;
    width: number;
    height: number;
}

interface CropDialogProps {
    imageSrc: string;
    onConfirm: (result: CroppedImageResult | null) => void;
    showSkipButton?: boolean;
}

function getCroppedImg(image: HTMLImageElement, crop: Crop): Promise<CroppedImageResult> {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    let targetWidth = Math.floor(crop.width * scaleX);
    let targetHeight = Math.floor(crop.height * scaleY);
    
    // Resize logic
    if (targetWidth > MAX_IMAGE_DIMENSION || targetHeight > MAX_IMAGE_DIMENSION) {
        if (targetWidth > targetHeight) {
            const ratio = MAX_IMAGE_DIMENSION / targetWidth;
            targetWidth = MAX_IMAGE_DIMENSION;
            targetHeight = Math.floor(targetHeight * ratio);
        } else {
            const ratio = MAX_IMAGE_DIMENSION / targetHeight;
            targetHeight = MAX_IMAGE_DIMENSION;
            targetWidth = Math.floor(targetWidth * ratio);
        }
    }
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
  
    if (!ctx) {
      return Promise.reject(new Error('Failed to get canvas context.'));
    }
  
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      targetWidth,
      targetHeight
    );
  
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          const objectUrl = URL.createObjectURL(blob);
          resolve({
              blob,
              objectUrl,
              width: targetWidth,
              height: targetHeight,
          });
        },
        'image/jpeg',
        0.9 // Use 90% quality
      );
    });
}

export function CropDialog({ imageSrc, onConfirm, showSkipButton = false }: CropDialogProps) {
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<Crop>();
    const imageRef = useRef<HTMLImageElement>(null);
    const { toast } = useToast();

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        const initialCrop: Crop = {
          unit: '%',
          width: 90,
          height: 90,
          x: 5,
          y: 5
        };
        const centeredCrop = centerCrop(initialCrop, width, height);
        setCrop(centeredCrop);
        setCompletedCrop(centeredCrop);
    };

    const handleConfirm = async () => {
        if (completedCrop && imageRef.current) {
          try {
            const result = await getCroppedImg(imageRef.current, completedCrop);
            onConfirm(result);
          } catch (error) {
            console.error('Error cropping image:', error);
            toast({
              variant: 'destructive',
              title: 'Error al recortar',
              description: 'No se pudo procesar la imagen. Inténtalo de nuevo.',
            });
          }
        }
    };

    const handleSkip = () => {
        if (imageRef.current) {
            // "Skip" still respects the max dimensions, but doesn't crop
            const fullCrop: Crop = { unit: 'px', x: 0, y: 0, width: imageRef.current.naturalWidth, height: imageRef.current.naturalHeight };
            getCroppedImg(imageRef.current, fullCrop)
                .then(onConfirm)
                .catch(err => {
                     toast({ variant: 'destructive', title: 'Error al procesar', description: 'No se pudo procesar la imagen. Inténtalo de nuevo.' });
                });
        }
    }

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onConfirm(null)}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Recorta tu imagen</DialogTitle>
                    <DialogDescription>Ajusta el recuadro para seleccionar la parte de la imagen que quieres mostrar.</DialogDescription>
                </DialogHeader>
                <div className="flex justify-center">
                    <ReactCrop
                        crop={crop}
                        onChange={c => setCrop(c)}
                        onComplete={c => setCompletedCrop(c)}
                        minWidth={100}
                        minHeight={100}
                        className="max-h-[70vh]"
                    >
                        <img ref={imageRef} alt="Recortar imagen" src={imageSrc} onLoad={onImageLoad} />
                    </ReactCrop>
                </div>
                <DialogFooter>
                    {showSkipButton && (
                         <Button variant="ghost" onClick={handleSkip}>Omitir recorte</Button>
                    )}
                    <Button variant="outline" onClick={() => onConfirm(null)}>Cancelar</Button>
                    <Button onClick={handleConfirm}>Confirmar Recorte</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
