
'use server';

import { suggestTitle } from '@/ai/flows/suggest-title';
import { db, storage } from '@/lib/firebase';
import { addDoc, collection, deleteDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
import { deleteObject, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import type { DiaryEvent } from '@/types';

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
    { title, description, image, date }: { title: string; description: string; image: string; date: Date; }
  ): Promise<{ success?: boolean; error?: string }> {

  if (!title || !description || !image || !date) {
    return { error: 'Missing required fields' };
  }

  try {
    const storageRef = ref(storage, `events/${Date.now()}_${title.replace(/\s+/g, '-')}.jpg`);
    
    // The image is a data URI, so we need to extract the base64 part
    const base64Data = image.split(',')[1];
    
    const snapshot = await uploadString(storageRef, base64Data, 'base64', {
      contentType: 'image/jpeg',
    });
    const downloadURL = await getDownloadURL(snapshot.ref);

    await addDoc(collection(db, 'events'), {
      title,
      description,
      imageUrl: downloadURL,
      createdAt: date,
    });
  } catch (error: any) {
    console.error("Detailed Error in createEventAction:", error);
    return { error: `Failed to create event: ${error.message}` };
  }
  
  revalidatePath('/');
  revalidatePath('/event');
  return { success: true };
}


export async function deleteEventAction(
  { id, imageUrl }: { id: string; imageUrl: string; }
): Promise<{ success?: boolean; error?: string }> {
  if (!id || !imageUrl) {
    return { error: 'ID de evento o URL de imagen faltante.' };
  }

  // Note: This doesn't delete sub-collections like 'content'.
  // For a full delete, a Cloud Function would be needed to handle this recursively.

  try {
    if (imageUrl) {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    }
    
    await deleteDoc(doc(db, 'events', id));
    
  } catch (error: any) {
    console.error('Error deleting event:', error);
    if (error.code === 'storage/object-not-found') {
      console.warn('La imagen no se encontró en Storage, pero se eliminará el documento de Firestore.');
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
  revalidatePath('/event');
  return { success: true };
}
