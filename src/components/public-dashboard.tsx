'use client';

import * as React from 'react';
import type { Shift, Pharmacy } from '@/lib/types';
import ShiftCalendar from '@/components/shift-calendar';
import ShiftList from '@/components/shift-list';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { PublicHeader } from '@/components/public-header';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, getDocs } from 'firebase/firestore';

interface PublicDashboardProps {
  userId: string;
}

export function PublicDashboard({ userId }: PublicDashboardProps) {
  const firestore = useFirestore();

  const pharmaciesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'pharmacies'), where('userId', '==', userId));
  }, [firestore, userId]);
  const { data: pharmacies, isLoading: isLoadingPharmacies } = useCollection<Pharmacy>(pharmaciesQuery);

  const shiftsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'shifts'), where('userId', '==', userId));
  }, [firestore, userId]);
  const { data: shifts, isLoading: isLoadingShifts } = useCollection<Shift>(shiftsQuery);
  
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());

  const shiftsWithDateObjects = React.useMemo(() => {
    return shifts?.map(s => ({
      ...s,
      date: s.date instanceof Timestamp ? s.date.toDate() : new Date(s.date as string)
    })) || [];
  }, [shifts]);


  const shiftsOnSelectedDate = shiftsWithDateObjects.filter(
    (shift) =>
      selectedDate &&
      shift.date.toDateString() === selectedDate.toDateString()
  );

  if (isLoadingPharmacies || isLoadingShifts) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <PublicHeader />
      <div className="container mx-auto grid max-w-7xl grid-cols-1 gap-8 p-4 md:grid-cols-3 lg:grid-cols-5 md:p-6 lg:p-8">
        <div className="lg:col-span-3 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Shift Calendar</CardTitle>
              <CardDescription>Select a day to view available shifts. Days with available shifts are marked with a dot.</CardDescription>
            </CardHeader>
            <CardContent>
              <ShiftCalendar
                shifts={shiftsWithDateObjects}
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
                pharmacies={pharmacies || []}
                onBookShift={() => {}}
                isPublicView={true}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
