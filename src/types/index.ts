
import type { Timestamp } from "firebase/firestore";

export interface DiaryEvent {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imagePath: string; // Ruta del archivo en Firebase Storage
  createdAt: Date;
  width?: number;
  height?: number;
}

export interface NewDiaryEvent {
  title: string;
  description: string;
  imageUrl: string;
  date: Date;
}

// Base para todo el contenido
interface BaseContent {
  id: string;
  createdAt: Date;
}

// Tipos de contenido específicos
export interface TextContent extends BaseContent {
  type: 'text';
  value: string;
}

export interface ImageContent extends BaseContent {
  type: 'image';
  value: string; // URL de la imagen
  imagePath: string;
  width?: number;
  height?: number;
}

export interface GalleryImage {
    value: string; // URL
    imagePath: string;
    width: number;
    height: number;
}

export interface GalleryContent extends BaseContent {
    type: 'gallery';
    images: GalleryImage[];
}


// Unión discriminada de todos los tipos de contenido
export type EventContent = TextContent | ImageContent | GalleryContent;
