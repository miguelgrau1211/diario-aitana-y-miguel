'use server';

import { suggestTitle } from '@/ai/flows/suggest-title';
import { db, storage } from '@/lib/firebase';
import { addDoc, collection, deleteDoc, doc } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import { revalidatePath } from 'next/cache';

export async function generateTitleAction(description: string) {
  try {
    const result = await suggestTitle({ description });
    return { title: result.title };
  } catch (error) {
    console.error('Error suggesting title:', error);
    if (error instanceof Error) {
      return { error: `Failed to suggest title: ${error.message}` };
    }
    return { error: 'An unknown error occurred while suggesting the title.' };
  }
}

export async function createEventAction(
    { title, description, imageUrl, date }: { title: string; description: string; imageUrl: string; date: Date; }
  ): Promise<{ success?: boolean; error?: string }> {

  if (!title || !description || !imageUrl || !date) {
    return { error: 'Missing required fields' };
  }

  try {
    await addDoc(collection(db, 'events'), {
      title,
      description,
      imageUrl: imageUrl,
      createdAt: date,
    });
  } catch (error: any) {
    console.error('Error creating event:', error);
    return { error: `Failed to create event: ${error.message}` };
  }
  
  revalidatePath('/');
  return { success: true };
}


export async function deleteEventAction(
  { id, imageUrl }: { id: string; imageUrl: string; }
): Promise<{ success?: boolean; error?: string }> {
  if (!id || !imageUrl) {
    return { error: 'ID de evento o URL de imagen faltante.' };
  }

  try {
    // Primero, elimina la imagen de Firebase Storage
    if (imageUrl) {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    }
    
    // Luego, elimina el documento de Firestore
    await deleteDoc(doc(db, 'events', id));
    
  } catch (error: any) {
    console.error('Error deleting event:', error);
    // Proporciona un mensaje de error más específico si es posible
    if (error.code === 'storage/object-not-found') {
      console.warn('La imagen no se encontró en Storage, pero se eliminará el documento de Firestore.');
      // Intenta eliminar el documento de todos modos
      try {
        await deleteDoc(doc(db, 'events', id));
      } catch (dbError: any) {
         return { error: `Error al eliminar el recuerdo de la base de datos: ${dbError.message}` };
      }
    } else {
      return { error: `Error al eliminar el recuerdo: ${error.message}` };
    }
  }

  revalidatePath('/');
  return { success: true };
}
