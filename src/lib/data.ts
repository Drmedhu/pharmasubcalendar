import type { Pharmacy, Shift } from './types';
import { subDays, addDays } from 'date-fns';

export const pharmacies: Pharmacy[] = [
  { id: 'ph_1', name: 'HealthFirst Pharmacy', address: '123 Main St, Anytown' },
  { id: 'ph_2', name: 'Wellness Rx', address: '456 Oak Ave, Anytown' },
  { id: 'ph_3', name: 'City Central Drugs', address: '789 Pine Ln, Anytown' },
];

const today = new Date();

export const shifts: Shift[] = [
  {
    id: 'sh_1',
    pharmacyId: 'ph_1',
    date: today.toISOString(),
    startTime: '09:00',
    endTime: '17:00',
    payRate: 55,
    status: 'available',
  },
  {
    id: 'sh_2',
    pharmacyId: 'ph_2',
    date: today.toISOString(),
    startTime: '13:00',
    endTime: '21:00',
    payRate: 60,
    status: 'available',
  },
  {
    id: 'sh_3',
    pharmacyId: 'ph_3',
    date: addDays(today, 2).toISOString(),
    startTime: '08:00',
    endTime: '16:00',
    payRate: 58,
    status: 'available',
  },
  {
    id: 'sh_4',
    pharmacyId: 'ph_1',
    date: addDays(today, 2).toISOString(),
    startTime: '10:00',
    endTime: '18:00',
    payRate: 55,
    status: 'booked',
  },
  {
    id: 'sh_5',
    pharmacyId: 'ph_2',
    date: addDays(today, 5).toISOString(),
    startTime: '09:00',
    endTime: '15:00',
    payRate: 62,
    status: 'available',
  },
  {
    id: 'sh_6',
    pharmacyId: 'ph_3',
    date: subDays(today, 1).toISOString(),
    startTime: '14:00',
    endTime: '22:00',
    payRate: 65,
    status: 'booked',
  },
  {
    id: 'sh_7',
    pharmacyId: 'ph_1',
    date: addDays(today, 3).toISOString(),
    startTime: '09:00',
    endTime: '17:00',
    payRate: 55,
    status: 'available',
  },
];
