
'use client';

import { useState, useEffect } from 'react';
import 'react-image-crop/dist/ReactCrop.css';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, AlignLeft, AlignRight } from 'lucide-react';
import Image from 'next/image';
import { CropDialog, type CroppedImageResult } from './CropDialog';


interface AddImageTextDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSave: (data: { image: CroppedImageResult; text: string; position: 'left' | 'right' }) => void;
  isSaving: boolean;
}


export function AddImageTextDialog({ isOpen, setIsOpen, onSave, isSaving }: AddImageTextDialogProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [croppedImageResult, setCroppedImageResult] = useState<CroppedImageResult | null>(null);
  const [text, setText] = useState('');
  const [imagePosition, setImagePosition] = useState<'left' | 'right'>('left');
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
        toast({ variant: 'destructive', title: 'Error', description: 'Por favor, sube y recorta una imagen.' });
        return;
    }
    if (text.trim().length < 5) {
        toast({ variant: 'destructive', title: 'Error', description: 'Por favor, escribe un texto descriptivo.' });
        return;
    }

    onSave({
        image: croppedImageResult,
        text,
        position: imagePosition,
    });
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
            setText('');
            setImagePosition('left');
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Añadir Imagen con Texto</DialogTitle>
          <DialogDescription>Combina una foto con un texto para contar una historia más completa.</DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
            <div className="space-y-4">
                <Label>Imagen</Label>
                <label htmlFor="dropzone-file-dialog-imagetext" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors relative overflow-hidden">
                    {croppedImageResult?.objectUrl ? (
                        <Image src={croppedImageResult.objectUrl} alt="Vista previa recortada" layout="fill" className="object-contain" />
                    ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Haz clic para subir</span></p>
                        </div>
                    )}
                    <Input id="dropzone-file-dialog-imagetext" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
                 <div>
                    <Label>Posición de la Imagen</Label>
                    <RadioGroup
                        defaultValue="left"
                        value={imagePosition}
                        onValueChange={(value: 'left' | 'right') => setImagePosition(value)}
                        className="flex items-center gap-4 mt-2"
                        >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="left" id="r1" />
                            <Label htmlFor="r1" className="flex items-center gap-2 cursor-pointer"><AlignLeft/> Izquierda</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="right" id="r2" />
                            <Label htmlFor="r2" className="flex items-center gap-2 cursor-pointer"><AlignRight/> Derecha</Label>
                        </div>
                    </RadioGroup>
                </div>
            </div>
            <div className="space-y-4">
                <Label htmlFor="text-content">Texto</Label>
                <Textarea
                    id="text-content"
                    placeholder="Describe el momento, la emoción, el detalle..."
                    className="min-h-[240px] resize-none"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={isSaving}
                />
            </div>
        </div>

        <DialogFooter>
            <Button variant="ghost" onClick={() => handleCloseDialog(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isSaving || !croppedImageResult || !text}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Contenido
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
