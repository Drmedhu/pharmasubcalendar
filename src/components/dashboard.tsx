"use client";

import * as React from 'react';
import type { Shift, Pharmacy } from '@/lib/types';
import ShiftCalendar from '@/components/shift-calendar';
import ShiftList from '@/components/shift-list';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { Header } from '@/components/header';

interface DashboardProps {
  initialShifts: Shift[];
  initialPharmacies: Pharmacy[];
}

export function Dashboard({ initialShifts, initialPharmacies }: DashboardProps) {
  const [shifts, setShifts] = React.useState<Shift[]>(initialShifts);
  const [pharmacies, setPharmacies] = React.useState<Pharmacy[]>(initialPharmacies);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());

  const handleBookShift = (shiftId: string) => {
    setShifts((prevShifts) =>
      prevShifts.map((shift) =>
        shift.id === shiftId ? { ...shift, status: 'booked' } : shift
      )
    );
  };
  
  const handleCreateShift = (newShift: Omit<Shift, 'id' | 'status'>) => {
    setShifts((prevShifts) => [
      ...prevShifts,
      {
        ...newShift,
        id: `sh_${Date.now()}`,
        status: 'available',
      },
    ]);
  };
  
  const handleCreatePharmacy = (newPharmacy: Omit<Pharmacy, 'id'>) => {
    setPharmacies((prevPharmacies) => [
      ...prevPharmacies,
      {
        ...newPharmacy,
        id: `ph_${Date.now()}`,
      },
    ]);
  };

  const shiftsOnSelectedDate = shifts.filter(
    (shift) =>
      selectedDate &&
      new Date(shift.date).toDateString() === selectedDate.toDateString()
  );

  return (
    <>
      <Header pharmacies={pharmacies} onCreateShift={handleCreateShift} onCreatePharmacy={handleCreatePharmacy} />
      <div className="container mx-auto grid max-w-7xl grid-cols-1 gap-8 p-4 md:grid-cols-3 lg:grid-cols-5 md:p-6 lg:p-8">
        <div className="lg:col-span-3 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Shift Calendar</CardTitle>
              <CardDescription>Select a day to view available shifts. Days with available shifts are marked with a dot.</CardDescription>
            </CardHeader>
            <CardContent>
              <ShiftCalendar
                shifts={shifts}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2 md:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>
                Shifts for{' '}
                {selectedDate ? format(selectedDate, 'MMMM d') : '...'}
              </CardTitle>
              <CardDescription>
                All shifts scheduled for the selected day.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ShiftList
                shifts={shiftsOnSelectedDate}
                pharmacies={pharmacies}
                onBookShift={handleBookShift}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
