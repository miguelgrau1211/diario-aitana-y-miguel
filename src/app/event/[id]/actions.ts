
'use server';

import { db, storage } from '@/lib/firebase';
import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, Timestamp, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { DiaryEvent, EventContent } from '@/types';

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
      return {
        id: doc.id,
        type: data.type,
        value: data.value,
        imagePath: data.imagePath || null,
        createdAt: createdAtTimestamp ? createdAtTimestamp.toDate() : new Date(),
        width: data.width,
        height: data.height,
      } as EventContent;
    });
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

export async function deleteEventAction(
  { id, imagePath }: { id: string; imagePath: string; }
): Promise<{ success?: boolean; error?: string }> {
  if (!id) {
    return { error: 'ID de evento faltante.' };
  }

  try {
    // 1. Delete content subcollection and its images
    const contentCollectionRef = collection(db, 'events', id, 'content');
    const contentSnapshot = await getDocs(query(contentCollectionRef));
    
    for (const contentDoc of contentSnapshot.docs) {
      const contentData = contentDoc.data();
      if (contentData.type === 'image' && contentData.imagePath) {
        try {
          const contentImageRef = ref(storage, contentData.imagePath);
          await deleteObject(contentImageRef);
        } catch (storageError: any) {
          if (storageError.code !== 'storage/object-not-found') {
            console.warn(`Could not delete content image ${contentData.imagePath}: ${storageError.message}`);
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
