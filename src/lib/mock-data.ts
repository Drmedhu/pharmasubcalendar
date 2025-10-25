import type { UserProfile, Shift, Pharmacy } from './types';
import { ADMIN_EMAIL } from './admin';

export const MOCK_PROFILES: UserProfile[] = [
  {
    id: 'admin-profile-id',
    userId: 'admin-user-id-placeholder', // This will be ignored for admin
    name: 'Admin User',
    email: ADMIN_EMAIL,
    role: 'admin',
  },
  {
    id: 'pharmacy-profile-id-1',
    userId: 'pharmacy-user-id-1', // This will be dynamically assigned
    name: 'City Central Pharmacy User',
    email: 'pharmacy1@example.com',
    role: 'pharmacy',
  },
  {
    id: 'pharmacy-profile-id-2',
    userId: 'pharmacy-user-id-2',
    name: 'Suburb Pharmacy User',
    email: 'pharmacy2@example.com',
    role: 'pharmacy',
  },
  {
    id: 'substitute-profile-id-1',
    userId: 'substitute-user-id-1',
    name: 'Alice Substitute',
    email: 'sub1@example.com',
    role: 'substitute',
  },
  {
    id: 'substitute-profile-id-2',
    userId: 'substitute-user-id-2',
    name: 'Bob Substitute',
    email: 'sub2@example.com',
    role: 'substitute',
  },
];

export const MOCK_PHARMACIES: Pharmacy[] = [
    {
        id: 'pharmacy-1',
        userId: 'pharmacy-profile-id-1', // Corresponds to UserProfile id
        name: 'City Central Pharmacy',
        address: '123 Main St, Downtown',
        email: 'contact@citycentral.com',
    },
    {
        id: 'pharmacy-2',
        userId: 'pharmacy-profile-id-2', // Corresponds to UserProfile id
        name: 'Suburb Pharmacy',
        address: '456 Oak Ave, Suburbia',
        email: 'info@suburbpharm.com',
    }
];

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const dayAfter = new Date(today);
dayAfter.setDate(dayAfter.getDate() + 2);


export const MOCK_SHIFTS: Shift[] = [
  {
    id: 'shift-1',
    pharmacyId: 'pharmacy-1',
    userId: 'pharmacy-profile-id-1',
    date: today.toISOString(),
    startTime: '09:00',
    endTime: '17:00',
    payRate: 55,
    role: 'pharmacist',
    status: 'available',
  },
  {
    id: 'shift-2',
    pharmacyId: 'pharmacy-1',
    userId: 'pharmacy-profile-id-1',
    date: today.toISOString(),
    startTime: '10:00',
    endTime: '18:00',
    payRate: 25,
    role: 'assistant',
    status: 'booked',
    bookedBy: 'substitute-profile-id-1',
  },
  {
    id: 'shift-3',
    pharmacyId: 'pharmacy-2',
    userId: 'pharmacy-profile-id-2',
    date: tomorrow.toISOString(),
    startTime: '08:00',
    endTime: '16:00',
    payRate: 60,
    role: 'pharmacist',
    status: 'available',
  },
    {
    id: 'shift-4',
    pharmacyId: 'pharmacy-2',
    userId: 'pharmacy-profile-id-2',
    date: dayAfter.toISOString(),
    startTime: '12:00',
    endTime: '20:00',
    payRate: 58,
    role: 'pharmacist',
    status: 'available',
  },
];
