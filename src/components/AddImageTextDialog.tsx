
'use client';

import { useState } from 'react';
import 'react-image-crop/dist/ReactCrop.css';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { addImageTextContentAction } from '@/app/event/[id]/actions';
import { Loader2, Upload, AlignLeft, AlignRight } from 'lucide-react';
import Image from 'next/image';
import type { EventContent } from '@/types';
import { CropDialog } from './CropDialog';

interface AddImageTextDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  eventId: string;
  onImageTextAdded: () => void;
  addOptimisticContent: (item: EventContent) => void;
}

interface CroppedImageResult {
    base64: string;
    width: number;
    height: number;
}

export function AddImageTextDialog({ isOpen, setIsOpen, eventId, onImageTextAdded, addOptimisticContent }: AddImageTextDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    } else {
      setImageSrc(null);
    }
  };
  
  const handleCropConfirm = async (result: CroppedImageResult | null) => {
    if (result) {
        setCroppedImageResult(result);
    }
    setImageSrc(null);
  }

  const handleSubmit = async () => {
    if (!croppedImageResult) {
        toast({ variant: 'destructive', title: 'Error', description: 'Por favor, sube y recorta una imagen.' });
        return;
    }
    if (text.trim().length < 5) {
        toast({ variant: 'destructive', title: 'Error', description: 'Por favor, escribe un texto descriptivo.' });
        return;
    }

    setIsSubmitting(true);
    
    addOptimisticContent({
        id: `optimistic-${Date.now()}`,
        type: 'imageText',
        createdAt: new Date(),
        imageUrl: croppedImageResult.base64,
        imagePath: '',
        width: croppedImageResult.width,
        height: croppedImageResult.height,
        text,
        imagePosition,
    });
    handleCloseDialog(false);

    try {
      const result = await addImageTextContentAction({ 
          eventId, 
          imageBase64: croppedImageResult.base64,
          width: croppedImageResult.width,
          height: croppedImageResult.height,
          text,
          imagePosition,
      });
      
      if (result.error) throw new Error(result.error);
      
      toast({
        title: '¡Contenido añadido!',
        description: 'La combinación de imagen y texto se ha guardado.',
      });

      await onImageTextAdded();

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error al guardar', description: error.message });
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
            setText('');
            setImagePosition('left');
        }
    }
  };

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
                <label htmlFor="dropzone-file-dialog" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors relative overflow-hidden">
                    {croppedImageResult?.base64 ? (
                        <Image src={croppedImageResult.base64} alt="Vista previa recortada" layout="fill" className="object-contain" />
                    ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Haz clic para subir</span></p>
                        </div>
                    )}
                    <Input id="dropzone-file-dialog" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
                 <div>
                    <Label>Posición de la Imagen</Label>
                    <RadioGroup
                        defaultValue="left"
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
                    disabled={isSubmitting}
                />
            </div>
        </div>

        <DialogFooter>
            <Button variant="ghost" onClick={() => handleCloseDialog(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !croppedImageResult || !text}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Contenido
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
