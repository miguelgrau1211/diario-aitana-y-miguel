'use server';

import { suggestTitle } from '@/ai/flows/suggest-title';
import { db, storage } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { revalidatePath } from 'next/cache';

export async function generateTitleAction(description: string) {
  try {
    const result = await suggestTitle({ description });
    return { title: result.title };
  } catch (error) {
    console.error('Error suggesting title:', error);
    return { error: 'Failed to suggest title.' };
  }
}

export async function createEventAction(formData: FormData): Promise<{ success?: boolean, error?: string, redirectPath?: string }> {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const image = formData.get('image') as File;

  if (!title || !description || !image) {
    return { error: 'Missing required fields' };
  }

  try {
    // 1. Upload image to Firebase Storage
    const storageRef = ref(storage, `events/${Date.now()}_${image.name}`);
    const snapshot = await uploadBytes(storageRef, image);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // 2. Save event to Firestore
    await addDoc(collection(db, 'events'), {
      title,
      description,
      imageUrl: downloadURL,
      createdAt: serverTimestamp(),
    });

  } catch (error) {
    console.error('Error creating event:', error);
    return { error: 'Failed to create event.' };
  }
  
  revalidatePath('/');
  return { success: true, redirectPath: '/' };
}
