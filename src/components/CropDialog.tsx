
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

interface CroppedImageResult {
    base64: string;
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
            const img = imageRef.current;
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            const base64 = canvas.toDataURL('image/jpeg', 0.95);
            onConfirm({
                base64,
                width: img.naturalWidth,
                height: img.naturalHeight
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
