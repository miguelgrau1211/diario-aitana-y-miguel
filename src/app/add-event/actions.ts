'use server';

import { suggestTitle } from '@/ai/flows/suggest-title';
import { db, storage } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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
    { title, description, imageDataUri, imageName }: { title: string; description: string; imageDataUri: string; imageName: string;}
  ): Promise<{ success?: boolean; error?: string }> {

  if (!title || !description || !imageDataUri || !imageName) {
    return { error: 'Missing required fields' };
  }

  try {
    const storageRef = ref(storage, `events/${Date.now()}_${imageName}`);
    const snapshot = await uploadString(storageRef, imageDataUri, 'data_url');
    const downloadURL = await getDownloadURL(snapshot.ref);

    await addDoc(collection(db, 'events'), {
      title,
      description,
      imageUrl: downloadURL,
      createdAt: serverTimestamp(),
    });

  } catch (error: any) {
    console.error('Error creating event:', error);
    return { error: `Failed to create event: ${error.message}` };
  }
  
  revalidatePath('/');
  redirect('/');
}
