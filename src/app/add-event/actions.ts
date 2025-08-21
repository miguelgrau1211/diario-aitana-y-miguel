
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
    { title, description, image, date }: { title: string; description: string; image: string; date: Date; }
  ): Promise<{ success?: boolean; error?: string }> {

  if (!title || !description || !image || !date) {
    return { error: 'Missing required fields' };
  }

  try {
    const { getDownloadURL, uploadString } = await import('firebase/storage');
    const storageRef = ref(storage, `events/${Date.now()}_${title.replace(/\s+/g, '-')}.jpg`);
    
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
  if (!id) {
    return { error: 'ID de evento faltante.' };
  }

  try {
    // 1. Delete content subcollection
    const contentCollectionRef = collection(db, 'events', id, 'content');
    const contentQuery = query(contentCollectionRef);
    const contentSnapshot = await getDocs(contentQuery);
    
    for (const contentDoc of contentSnapshot.docs) {
      const contentData = contentDoc.data();
      // If content is an image, delete it from storage first
      if (contentData.type === 'image' && contentData.value) {
        try {
          const imageRef = ref(storage, contentData.value);
          await deleteObject(imageRef);
        } catch (storageError: any) {
            // Log if image not found, but don't stop the whole process
            if (storageError.code !== 'storage/object-not-found') {
              console.warn(`Could not delete content image ${contentData.value}: ${storageError.message}`);
            }
        }
      }
      await deleteDoc(doc(db, 'events', id, 'content', contentDoc.id));
    }

    // 2. Delete the main event image from Storage
    if (imageUrl) {
        try {
            const mainImageRef = ref(storage, imageUrl);
            await deleteObject(mainImageRef);
        } catch (storageError: any) {
             if (storageError.code !== 'storage/object-not-found') {
                console.warn(`Could not delete main image ${imageUrl}: ${storageError.message}`);
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
  return { success: true };
}
