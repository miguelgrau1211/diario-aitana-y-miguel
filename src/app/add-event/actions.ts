
'use server';

import { suggestTitle } from '@/ai/flows/suggest-title';
import { db, storage } from '@/lib/firebase';
import { addDoc, collection, getDocs, query } from 'firebase/firestore';
import { ref, getMetadata, listAll } from 'firebase/storage';
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
    { title, description, image, date, width, height }: { title: string; description: string; image: Blob; date: Date; width: number; height: number; }
  ): Promise<{ success?: boolean; error?: string }> {

  if (!title || !description || !image || !date || !width || !height) {
    return { error: 'Missing required fields' };
  }

  try {
    const { getDownloadURL, uploadBytes } = await import('firebase/storage');
    const imagePath = `events/${Date.now()}_${title.replace(/\s+/g, '-')}.jpg`;
    const storageRef = ref(storage, imagePath);
    
    const snapshot = await uploadBytes(storageRef, image, {
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


export async function getStorageUsageAction(): Promise<{ usage?: number; error?: string }> {
  try {
    const listRef = ref(storage, 'events');
    const res = await listAll(listRef);
    let totalSize = 0;

    // Get size for top-level event images
    const topLevelFiles = res.items;
    const topLevelPromises = topLevelFiles.map(fileRef => getMetadata(fileRef).then(meta => meta.size));
    const topLevelSizes = await Promise.all(topLevelPromises);
    totalSize += topLevelSizes.reduce((acc, size) => acc + size, 0);

    // Get size for content images inside each event's folder
    const folderPromises = res.prefixes.map(async (folderRef) => {
        const subFolderRes = await listAll(folderRef);
        const subFolderFiles = subFolderRes.items;
        const subFolderPromises = subFolderFiles.map(fileRef => getMetadata(fileRef).then(meta => meta.size));
        const subFolderSizes = await Promise.all(subFolderPromises);
        return subFolderSizes.reduce((acc, size) => acc + size, 0);
    });

    const folderSizes = await Promise.all(folderPromises);
    totalSize += folderSizes.reduce((acc, size) => acc + size, 0);
    
    return { usage: totalSize };

  } catch (error: any) {
    console.error('Error calculating storage usage:', error);
    return { error: 'No se pudo calcular el uso del almacenamiento.' };
  }
}
