'use server';

import { suggestTitle } from '@/ai/flows/suggest-title';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
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
    { title, description, imageUrl }: { title: string; description: string; imageUrl: string; }
  ): Promise<{ success?: boolean; error?: string }> {

  if (!title || !description || !imageUrl) {
    return { error: 'Missing required fields' };
  }

  try {
    await addDoc(collection(db, 'events'), {
      title,
      description,
      imageUrl,
      createdAt: serverTimestamp(),
    });

  } catch (error: any) {
    console.error('Error creating event:', error);
    return { error: `Failed to create event: ${error.message}` };
  }
  
  revalidatePath('/');
  redirect('/');
}
