
'use server';

import { db, storage } from '@/lib/firebase';
import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, Timestamp, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { DiaryEvent, EventContent, GalleryImage } from '@/types';

export async function getEventAction(id: string): Promise<{ event?: Omit<DiaryEvent, 'createdAt'> & { createdAt: string }; error?: string }> {
  if (!id) {
    return { error: 'ID de evento faltante.' };
  }
  try {
    const docRef = doc(db, 'events', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const eventData = docSnap.data();
      const createdAt = (eventData.createdAt as Timestamp).toDate().toISOString();
      return { event: { id: docSnap.id, ...eventData, imagePath: eventData.imagePath || '', createdAt } as Omit<DiaryEvent, 'createdAt'> & { createdAt: string } };
    } else {
      return { error: 'No se encontró el recuerdo.' };
    }
  } catch (error: any) {
    console.error('Error fetching event:', error);
    return { error: `Error al obtener el recuerdo: ${error.message}` };
  }
}

export async function getEventContentAction(eventId: string): Promise<{ content?: EventContent[]; error?: string }> {
  if (!eventId) {
    return { error: 'ID de evento faltante.' };
  }
  try {
    const contentQuery = query(collection(db, 'events', eventId, 'content'), orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(contentQuery);
    const content = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const createdAtTimestamp = data.createdAt as Timestamp;
      const createdAt = createdAtTimestamp ? createdAtTimestamp.toDate() : new Date(); // Convert Timestamp to Date

      const baseContent = {
        id: doc.id,
        createdAt,
      };

      // Mapeo basado en el tipo
      switch (data.type) {
        case 'text':
          return { ...baseContent, type: 'text', value: data.value } as EventContent;
        case 'image':
          return { ...baseContent, type: 'image', value: data.value, imagePath: data.imagePath, width: data.width, height: data.height } as EventContent;
        case 'gallery':
          return { ...baseContent, type: 'gallery', images: data.images } as EventContent;
        case 'imageText':
          return { ...baseContent, type: 'imageText', ...data } as EventContent;
        default:
          return null;
      }
    }).filter(item => item !== null).map(item => ({ ...item!, createdAt: (item!.createdAt as Date).toISOString() })) // Serialize Date to string
      .map(item => ({...item, createdAt: new Date(item.createdAt)})); // Then back to Date on server to match type.

    return { content };
  } catch (error: any) {
    console.error('Error fetching event content:', error);
    return { error: `Error al obtener el contenido del recuerdo: ${error.message}` };
  }
}

export async function addTextContentAction(
  { eventId, text }: { eventId: string; text: string }
): Promise<{ success?: boolean; error?: string }> {
  if (!eventId || !text) {
    return { error: 'Faltan datos para añadir el texto.' };
  }

  try {
    await addDoc(collection(db, 'events', eventId, 'content'), {
      type: 'text',
      value: text,
      createdAt: serverTimestamp(),
    });
    revalidatePath(`/event/${eventId}`);
    return { success: true };
  } catch (error: any) {
    return { error: `No se pudo guardar el texto: ${error.message}` };
  }
}

export async function addImageContentAction(
  { eventId, imageBase64, width, height }: { eventId: string; imageBase64: string; width: number; height: number; }
): Promise<{ success?: boolean; error?: string }> {
  if (!eventId || !imageBase64 || !width || !height) {
    return { error: 'Faltan datos para añadir la imagen.' };
  }
  try {
    const imagePath = `events/${eventId}/content/${Date.now()}.jpg`;
    const storageRef = ref(storage, imagePath);
    const base64Data = imageBase64.split(',')[1];
    
    const snapshot = await uploadString(storageRef, base64Data, 'base64', {
      contentType: 'image/jpeg',
    });
    const downloadURL = await getDownloadURL(snapshot.ref);

    await addDoc(collection(db, 'events', eventId, 'content'), {
      type: 'image',
      value: downloadURL,
      imagePath: imagePath,
      createdAt: serverTimestamp(),
      width,
      height,
    });
    
    revalidatePath(`/event/${eventId}`);
    return { success: true };
  } catch (error: any) {
    return { error: `No se pudo guardar la imagen: ${error.message}` };
  }
}

export async function addGalleryContentAction(
    { eventId, images }: { eventId: string; images: { base64: string; width: number; height: number }[] }
  ): Promise<{ success?: boolean; error?: string }> {
    if (!eventId || !images || images.length === 0) {
      return { error: 'Faltan datos para añadir la galería.' };
    }
  
    try {
      const uploadedImages: GalleryImage[] = [];
  
      for (const image of images) {
        const imagePath = `events/${eventId}/content/gallery_${Date.now()}_${Math.random()}.jpg`;
        const storageRef = ref(storage, imagePath);
        const base64Data = image.base64.split(',')[1];
        
        const snapshot = await uploadString(storageRef, base64Data, 'base64', {
          contentType: 'image/jpeg',
        });
        const downloadURL = await getDownloadURL(snapshot.ref);
  
        uploadedImages.push({
          value: downloadURL,
          imagePath: imagePath,
          width: image.width,
          height: image.height,
        });
      }
  
      await addDoc(collection(db, 'events', eventId, 'content'), {
        type: 'gallery',
        images: uploadedImages,
        createdAt: serverTimestamp(),
      });
      
      revalidatePath(`/event/${eventId}`);
      return { success: true };
    } catch (error: any) {
      console.error("Error adding gallery content:", error);
      return { error: `No se pudo guardar la galería: ${error.message}` };
    }
}

export async function addImageTextContentAction({
    eventId,
    imageBase64,
    width,
    height,
    text,
    imagePosition
  }: {
    eventId: string;
    imageBase64: string;
    width: number;
    height: number;
    text: string;
    imagePosition: 'left' | 'right';
  }): Promise<{ success?: boolean; error?: string }> {
  if (!eventId || !imageBase64 || !width || !height || !text || !imagePosition) {
    return { error: 'Faltan datos para añadir el contenido.' };
  }
  try {
    const imagePath = `events/${eventId}/content/${Date.now()}_imgtext.jpg`;
    const storageRef = ref(storage, imagePath);
    const base64Data = imageBase64.split(',')[1];
    
    const snapshot = await uploadString(storageRef, base64Data, 'base64', {
      contentType: 'image/jpeg',
    });
    const downloadURL = await getDownloadURL(snapshot.ref);

    await addDoc(collection(db, 'events', eventId, 'content'), {
      type: 'imageText',
      imageUrl: downloadURL,
      imagePath,
      width,
      height,
      text,
      imagePosition,
      createdAt: serverTimestamp(),
    });
    
    revalidatePath(`/event/${eventId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error adding image-text content:", error);
    return { error: `No se pudo guardar el contenido: ${error.message}` };
  }
}


export async function deleteContentAction(
  { eventId, contentId, contentType, imagePaths }: { eventId: string, contentId: string, contentType: EventContent['type'], imagePaths: string[] }
): Promise<{ success?: boolean; error?: string }> {
  if (!eventId || !contentId) {
    return { error: 'Faltan datos para eliminar el contenido.' };
  }

  try {
    // 1. Delete image(s) from Storage if applicable
    if ((contentType === 'image' || contentType === 'gallery' || contentType === 'imageText') && imagePaths.length > 0) {
      for (const path of imagePaths) {
        if (path) {
           try {
              const imageRef = ref(storage, path);
              await deleteObject(imageRef);
            } catch (storageError: any) {
              // Ignore 'object-not-found' errors, as it might have been deleted already
              if (storageError.code !== 'storage/object-not-found') {
                console.warn(`No se pudo eliminar la imagen ${path}: ${storageError.message}`);
              }
            }
        }
      }
    }

    // 2. Delete the content document from Firestore
    await deleteDoc(doc(db, 'events', eventId, 'content', contentId));

    revalidatePath(`/event/${eventId}`);
    return { success: true };

  } catch (error: any) {
    console.error("Error deleting content:", error);
    return { error: `No se pudo eliminar el contenido: ${error.message}` };
  }
}


export async function deleteEventAction(
    { id, imagePath }: { id: string; imagePath: string; }
  ): Promise<{ success?: boolean; error?: string }> {
    if (!id) {
      return { error: 'ID de evento faltante.' };
    }
  
    try {
      // 1. Delete content subcollection and its images from Storage
      const contentCollectionRef = collection(db, 'events', id, 'content');
      const contentSnapshot = await getDocs(query(contentCollectionRef));
      
      for (const contentDoc of contentSnapshot.docs) {
        const contentData = contentDoc.data() as EventContent;
        let imagePathsToDelete: string[] = [];

        if (contentData.type === 'image' && contentData.imagePath) {
          imagePathsToDelete.push(contentData.imagePath);
        } else if (contentData.type === 'gallery') {
            imagePathsToDelete = contentData.images.map(img => img.imagePath);
        } else if (contentData.type === 'imageText' && contentData.imagePath) {
            imagePathsToDelete.push(contentData.imagePath);
        }
        
        for (const path of imagePathsToDelete) {
             if (path) {
                try {
                    const imageRef = ref(storage, path);
                    await deleteObject(imageRef);
                } catch (storageError: any) {
                    if (storageError.code !== 'storage/object-not-found') {
                        console.warn(`No se pudo eliminar la imagen de contenido ${path}: ${storageError.message}`);
                    }
                }
            }
        }
        
        await deleteDoc(doc(db, 'events', id, 'content', contentDoc.id));
      }
  
      // 2. Delete the main event image from Storage
      if (imagePath) {
        try {
          const mainImageRef = ref(storage, imagePath);
          await deleteObject(mainImageRef);
        } catch (storageError: any) {
          if (storageError.code !== 'storage/object-not-found') {
            console.warn(`Could not delete main image ${imagePath}: ${storageError.message}`);
          }
        }
      }
      
      // 3. Delete the main event document from Firestore
      await deleteDoc(doc(db, 'events', id));
      
    } catch (error: any) {
      console.error('Error deleting event and its content:', error);
      return { error: `Error al eliminar el recuerdo completo: ${error.message}` };
    }
  
    revalidatePath('/');
    revalidatePath('/event');
    redirect('/');
}
