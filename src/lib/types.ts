export type Pharmacy = {
  id: string;
  name: string;
  address: string;
};

export type Shift = {
  id: string;
  pharmacyId: string;
  date: string; // ISO string for date to be serializable
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  payRate: number; // per hour
  status: 'available' | 'booked';
  bookedBy?: string;
};
