"use client";

import * as React from 'react';
import type { Shift, Pharmacy } from '@/lib/types';
import ShiftCalendar from '@/components/shift-calendar';
import ShiftList from '@/components/shift-list';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';

interface DashboardProps {
  initialShifts: Shift[];
  pharmacies: Pharmacy[];
}

export function Dashboard({ initialShifts, pharmacies }: DashboardProps) {
  const [shifts, setShifts] = React.useState<Shift[]>(initialShifts);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());

  const handleBookShift = (shiftId: string) => {
    setShifts((prevShifts) =>
      prevShifts.map((shift) =>
        shift.id === shiftId ? { ...shift, status: 'booked' } : shift
      )
    );
  };

  const shiftsOnSelectedDate = shifts.filter(
    (shift) =>
      selectedDate &&
      new Date(shift.date).toDateString() === selectedDate.toDateString()
  );

  return (
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
  );
}
