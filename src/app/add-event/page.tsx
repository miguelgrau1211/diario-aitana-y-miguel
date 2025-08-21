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
import { createEventAction } from './actions';
import { ArrowLeft, CalendarIcon, Loader2, Upload } from 'lucide-react';
import Image from 'next/image';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const eventFormSchema = z.object({
  title: z.string().min(2, { message: 'El título debe tener al menos 2 caracteres.' }).max(100),
  description: z.string().min(10, { message: 'La descripción debe tener al menos 10 caracteres.' }).max(5000),
  image: z.any().refine((files) => files?.length === 1, 'Se requiere una imagen.'),
  date: z.date({
    required_error: 'Se requiere una fecha para el recuerdo.',
  }),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

export default function AddEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      description: '',
      image: undefined,
      date: new Date(),
    },
  });

  const onSubmit = async (data: EventFormValues) => {
    setIsSubmitting(true);
    
    if (!previewImage) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se ha seleccionado ninguna imagen.',
        });
        setIsSubmitting(false);
        return;
    }

    try {
      const result = await createEventAction({
        title: data.title,
        description: data.description,
        image: previewImage,
        date: data.date,
      });
      
      if (result?.error) {
        throw new Error(result.error);
      }
      
      toast({
        title: '¡Recuerdo guardado!',
        description: 'Tu nuevo momento especial ha sido añadido a vuestro diario.',
      });

      router.push('/');

    } catch (error) {
      console.error("Detailed Error:", error)
      const errorMessage = error instanceof Error ? error.message : 'No se pudo guardar el recuerdo. Por favor, inténtalo de nuevo.';
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: errorMessage,
      });
    } finally {
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
                    <FormControl>
                      <Input placeholder="Un día inolvidable..." {...field} />
                    </FormControl>
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
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha del Recuerdo</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Elige una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                          <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full aspect-[4/3] border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors relative overflow-hidden">
                              {previewImage ? (
                                  <Image src={previewImage} alt="Vista previa" fill className="object-cover" />
                              ) : (
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                      <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                      <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Haz clic para subir</span> o arrastra y suelta</p>
                                      <p className="text-xs text-muted-foreground">PNG, JPG, GIF o WEBP</p>
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
