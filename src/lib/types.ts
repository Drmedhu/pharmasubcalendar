import type { Timestamp } from 'firebase/firestore';

export type Pharmacy = {
  id: string;
  name: string;
  address: string;
  email: string;
  userId?: string;
};

export type Shift = {
  id:string;
  pharmacyId: string;
  date: Date | Timestamp | string; // Allow multiple types for flexibility
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  payRate: number; // per hour
  status: 'available' | 'booked';
  role: 'pharmacist' | 'assistant';
  bookedBy?: string; // This should be userProfileId
  userId?: string;
};

export type UserProfile = {
    id: string;
    userId: string;
    name: string;
    email: string;
    role: 'pharmacist' | 'assistant';
};
