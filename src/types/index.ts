import type { Timestamp } from "firebase/firestore";

export interface DiaryEvent {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: Timestamp;
}

export interface NewDiaryEvent {
  title: string;
  description: string;
  imageUrl: string;
  createdAt?: Timestamp;
  date: Date;
}
