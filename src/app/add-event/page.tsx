'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { generateTitleAction, createEventAction } from './actions';
import { ArrowLeft, Loader2, Sparkles, Upload } from 'lucide-react';
import Image from 'next/image';

const eventFormSchema = z.object({
  title: z.string().min(2, { message: 'El título debe tener al menos 2 caracteres.' }).max(100),
  description: z.string().min(10, { message: 'La descripción debe tener al menos 10 caracteres.' }).max(5000),
  image: z.any().refine((files) => files?.length === 1, 'Se requiere una imagen.'),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

const fileToDataUri = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    resolve(event.target?.result as string);
  };
  reader.onerror = (error) => {
    reject(error);
  };
  reader.readAsDataURL(file);
});


export default function AddEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggestingTitle, setIsSuggestingTitle] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      description: '',
      image: undefined,
    },
  });

  const handleTitleSuggestion = async () => {
    const description = form.getValues('description');
    if (!description || description.length < 10) {
      toast({
        variant: 'destructive',
        title: 'Descripción muy corta',
        description: 'Por favor, escribe al menos 10 caracteres para sugerir un título.',
      });
      return;
    }
    setIsSuggestingTitle(true);
    try {
      const result = await generateTitleAction(description);
      if (result.title) {
        form.setValue('title', result.title);
        toast({
          title: 'Título sugerido',
          description: 'Se ha generado un título para tu recuerdo.',
        });
      } else {
        throw new Error('No se pudo generar el título.');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo sugerir un título. Inténtalo de nuevo.',
      });
    } finally {
      setIsSuggestingTitle(false);
    }
  };

  const onSubmit = async (data: EventFormValues) => {
    setIsSubmitting(true);
    
    try {
      const imageFile = data.image[0] as File;

      // 1. Convert image to data URI
      const imageDataUri = await fileToDataUri(imageFile);

      // 2. Call server action with the data URI
      const result = await createEventAction({
        title: data.title,
        description: data.description,
        imageDataUri: imageDataUri,
      });
      
      if (result?.error) {
        throw new Error(result.error);
      }
      
      // The redirect is now handled in the server action, but show a toast before that
      toast({
        title: '¡Recuerdo guardado!',
        description: 'Tu nuevo momento especial ha sido añadido a vuestro diario.',
      });

    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'No se pudo guardar el recuerdo. Por favor, inténtalo de nuevo.';
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: errorMessage,
      });
      // Fallback in case redirect fails.
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => router.back()}>
               <ArrowLeft />
            </Button>
            <CardTitle className="font-headline text-2xl">Añadir un Nuevo Recuerdo</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input placeholder="Un día inolvidable..." {...field} />
                      </FormControl>
                      <Button type="button" variant="outline" size="icon" onClick={handleTitleSuggestion} disabled={isSuggestingTitle}>
                        {isSuggestingTitle ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        <span className="sr-only">Sugerir Título</span>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe vuestro momento especial..." className="resize-y min-h-[120px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagen del Recuerdo</FormLabel>
                    <FormControl>
                       <div className="flex items-center justify-center w-full">
                          <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors">
                              {previewImage ? (
                                  <Image src={previewImage} alt="Vista previa" width={200} height={200} className="object-contain h-full p-2" />
                              ) : (
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                      <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                      <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Haz clic para subir</span> o arrastra y suelta</p>
                                      <p className="text-xs text-muted-foreground">PNG, JPG o GIF</p>
                                  </div>
                              )}
                              <Input id="dropzone-file" type="file" className="hidden" accept="image/*"
                                  onChange={(e) => {
                                      field.onChange(e.target.files);
                                      if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setPreviewImage(reader.result as string);
                                        };
                                        reader.readAsDataURL(file);
                                      } else {
                                        setPreviewImage(null);
                                      }
                                  }}
                              />
                          </label>
                      </div> 
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Recuerdo
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}