
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

export interface EventContent {
  id: string;
  type: 'text' | 'image';
  value: string;
  imagePath: string | null; // Ruta del archivo en Firebase Storage para imágenes
  createdAt: Date;
  width?: number;
  height?: number;
}
