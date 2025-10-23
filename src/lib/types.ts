import type { Timestamp } from 'firebase/firestore';

export type Pharmacy = {
  id: string;
  name: string;
  address: string;
  userId?: string;
};

export type Shift = {
  id: string;
  pharmacyId: string;
  date: Date | Timestamp | string; // Allow multiple types for flexibility
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  payRate: number; // per hour
  status: 'available' | 'booked';
  bookedBy?: string;
  userId?: string;
};
