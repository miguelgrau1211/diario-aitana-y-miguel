
'use client';

import { useState, useEffect } from 'react';
import 'react-image-crop/dist/ReactCrop.css';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import Image from 'next/image';
import { CropDialog, type CroppedImageResult } from './CropDialog';


interface AddImageDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSave: (imageData: CroppedImageResult) => void;
  isSaving: boolean;
}


export function AddImageDialog({ isOpen, setIsOpen, onSave, isSaving }: AddImageDialogProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
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
       e.target.value = '';
    } else {
      setImageSrc(null);
    }
  };
  
  const handleCropConfirm = (result: CroppedImageResult | null) => {
    if (result) {
        setCroppedImageResult(result);
    }
    setImageSrc(null);
  }

  const handleSubmit = () => {
    if (!croppedImageResult) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se ha subido o recortado ninguna imagen.' });
        return;
    }
    onSave(croppedImageResult);
    setIsOpen(false);
  };
  
  const handleCloseDialog = (open: boolean) => {
    if (!isSaving) {
        setIsOpen(open);
        if (!open) {
            setImageSrc(null);
            if (croppedImageResult?.objectUrl) {
                URL.revokeObjectURL(croppedImageResult.objectUrl);
            }
            setCroppedImageResult(null);
        }
    }
  };
  
  useEffect(() => {
    return () => {
        if (croppedImageResult?.objectUrl) {
            URL.revokeObjectURL(croppedImageResult.objectUrl);
        }
    }
  }, [croppedImageResult]);

  return (
    <>
     {imageSrc && (
        <CropDialog 
            imageSrc={imageSrc}
            onConfirm={handleCropConfirm}
        />
      )}
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir una nueva foto</DialogTitle>
          <DialogDescription>Sube y recorta una imagen que capture la esencia de este momento.</DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center justify-center w-full my-4">
            <label htmlFor="dropzone-file-dialog" className="flex flex-col items-center justify-center w-full min-h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors relative overflow-hidden">
                {croppedImageResult?.objectUrl ? (
                    <Image src={croppedImageResult.objectUrl} alt="Vista previa recortada" width={croppedImageResult.width} height={croppedImageResult.height} className="object-contain h-full w-auto" />
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
            <Button variant="ghost" onClick={() => handleCloseDialog(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isSaving || !croppedImageResult}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Foto
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
