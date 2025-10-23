"use client";

import * as React from 'react';
import type { Shift, Pharmacy } from '@/lib/types';
import ShiftCalendar from '@/components/shift-calendar';
import ShiftList from '@/components/shift-list';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { Header } from '@/components/header';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, Timestamp } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export function Dashboard() {
  const { user } = useUser();
  const firestore = useFirestore();

  const pharmaciesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'pharmacies');
  }, [firestore]);
  const { data: pharmacies, isLoading: isLoadingPharmacies } = useCollection<Pharmacy>(pharmaciesQuery);

  const shiftsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'shifts');
  }, [firestore]);
  const { data: shifts, isLoading: isLoadingShifts } = useCollection<Shift>(shiftsQuery);
  
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  const { toast } = useToast();

  const handleBookShift = (shiftId: string) => {
    if (!firestore || !user) return;
    const shiftRef = doc(firestore, 'shifts', shiftId);
    updateDocumentNonBlocking(shiftRef, { 
      status: 'booked',
      bookedBy: user.uid
    });
  };
  
  const handleCreateShift = (newShift: Omit<Shift, 'id' | 'status'>) => {
    if (!firestore) return;
    const shiftsCollection = collection(firestore, 'shifts');
    const { date, ...restOfShift } = newShift;
    const dateAsTimestamp = Timestamp.fromDate(new Date(date));
    addDocumentNonBlocking(shiftsCollection, {
      ...restOfShift,
      date: dateAsTimestamp,
      status: 'available',
      userId: user?.uid,
    });
  };
  
  const handleCreatePharmacy = (newPharmacy: Omit<Pharmacy, 'id'>) => {
     if (!firestore) return { ...newPharmacy, id: ''};
    const pharmaciesCollection = collection(firestore, 'pharmacies');
    addDocumentNonBlocking(pharmaciesCollection, {
      ...newPharmacy,
      userId: user?.uid,
    });
    // This return is optimistic. A better approach would be to wait for the doc ID.
    return { ...newPharmacy, id: `ph_${Date.now()}` };
  };

  const handleDeletePharmacy = async (pharmacyId: string) => {
    if (!firestore) return;
    const batch = writeBatch(firestore);
    
    // Delete the pharmacy
    const pharmacyRef = doc(firestore, 'pharmacies', pharmacyId);
    batch.delete(pharmacyRef);

    // Delete associated shifts
    if (shifts) {
        shifts.forEach(shift => {
            if (shift.pharmacyId === pharmacyId) {
                const shiftRef = doc(firestore, 'shifts', shift.id);
                batch.delete(shiftRef);
            }
        });
    }
    
    await batch.commit();

    toast({
        title: 'Pharmacy Deleted',
        description: 'The pharmacy and its associated shifts have been successfully deleted.',
    });
  };

  const shiftsWithDateObjects = React.useMemo(() => {
    return shifts?.map(s => ({
      ...s,
      date: s.date instanceof Timestamp ? s.date.toDate() : new Date(s.date)
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
      <Header pharmacies={pharmacies || []} onCreateShift={handleCreateShift} onCreatePharmacy={handleCreatePharmacy} onDeletePharmacy={handleDeletePharmacy} />
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
                onBookShift={handleBookShift}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
