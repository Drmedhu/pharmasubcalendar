import type { Timestamp } from 'firebase/firestore';

export type Pharmacy = {
  id: string;
  name: string;
  address: string;
  email: string;
  userId: string; // The user ID of the pharmacy owner
};

export type Shift = {
  id:string;
  pharmacyId: string; // The ID of the pharmacy, not the user
  date: Date | Timestamp | string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  payRate: number; // per hour
  status: 'available' | 'booked';
  role: 'pharmacist' | 'assistant';
  bookedBy?: string | null; // This should be userProfileId
  userId: string; // The ID of the user (pharmacy) who created the shift
};

export type UserProfile = {
    id: string;
    userId: string;
    name: string;
    email: string;
    role: 'pharmacy' | 'substitute' | 'admin';
};
