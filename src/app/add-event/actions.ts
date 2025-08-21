
'use server';

import { suggestTitle } from '@/ai/flows/suggest-title';
import { db, storage } from '@/lib/firebase';
import { addDoc, collection, deleteDoc, doc, getDocs, query } from 'firebase/firestore';
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
    { title, description, image, date, width, height }: { title: string; description: string; image: string; date: Date; width: number; height: number; }
  ): Promise<{ success?: boolean; error?: string }> {

  if (!title || !description || !image || !date || !width || !height) {
    return { error: 'Missing required fields' };
  }

  try {
    const { getDownloadURL, uploadString } = await import('firebase/storage');
    const imagePath = `events/${Date.now()}_${title.replace(/\s+/g, '-')}.jpg`;
    const storageRef = ref(storage, imagePath);
    
    const base64Data = image.split(',')[1];
    
    const snapshot = await uploadString(storageRef, base64Data, 'base64', {
      contentType: 'image/jpeg',
    });
    const downloadURL = await getDownloadURL(snapshot.ref);

    await addDoc(collection(db, 'events'), {
      title,
      description,
      imageUrl: downloadURL,
      imagePath: imagePath,
      createdAt: date,
      width,
      height,
    });
  } catch (error: any) {
    console.error("Detailed Error in createEventAction:", error);
    return { error: `Failed to create event: ${error.message}` };
  }
  
  revalidatePath('/');
  revalidatePath('/event');
  return { success: true };
}
