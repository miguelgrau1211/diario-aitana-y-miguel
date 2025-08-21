
'use server';

import { db, storage } from '@/lib/firebase';
import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, Timestamp, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
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
      return { event: { id: docSnap.id, ...eventData, createdAt } as Omit<DiaryEvent, 'createdAt'> & { createdAt: string } };
    } else {
      return { error: 'No se encontró el recuerdo.' };
    }
  } catch (error: any) => {
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
      return {
        id: doc.id,
        type: data.type,
        value: data.value,
        createdAt: (data.createdAt as Timestamp).toDate(),
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
  { eventId, imageBase64 }: { eventId: string; imageBase64: string }
): Promise<{ success?: boolean; error?: string }> {
  if (!eventId || !imageBase64) {
    return { error: 'Faltan datos para añadir la imagen.' };
  }
  try {
    const storageRef = ref(storage, `events/${eventId}/content/${Date.now()}.jpg`);
    const base64Data = imageBase64.split(',')[1];
    
    const snapshot = await uploadString(storageRef, base64Data, 'base64', {
      contentType: 'image/jpeg',
    });
    const downloadURL = await getDownloadURL(snapshot.ref);

    await addDoc(collection(db, 'events', eventId, 'content'), {
      type: 'image',
      value: downloadURL,
      createdAt: serverTimestamp(),
    });
    
    revalidatePath(`/event/${eventId}`);
    return { success: true };
  } catch (error: any) {
    return { error: `No se pudo guardar la imagen: ${error.message}` };
  }
}
