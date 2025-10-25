"use client";

import * as React from 'react';
import type { Shift, Pharmacy, UserProfile } from '@/lib/types';
import ShiftCalendar from '@/components/shift-calendar';
import ShiftList from '@/components/shift-list';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { Header } from '@/components/header';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, query, where, Timestamp } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { isAdmin } from '@/lib/admin';

export function Dashboard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const userIsAdmin = isAdmin(user);

  // User Profile data
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isLoadingUserProfile } = useDoc<UserProfile>(userProfileRef);

  // --- Data Fetching based on Role ---
  
  // PHARMACY role: fetches only their own pharmacies
  const pharmacyPharmaciesQuery = useMemoFirebase(() => {
    if (!firestore || !user || !userProfile || userProfile.role !== 'pharmacy') return null;
    return query(collection(firestore, 'pharmacies'), where('userId', '==', user.uid));
  }, [firestore, user, userProfile]);
  const { data: pharmacyPharmacies, isLoading: isLoadingPharmacyPharmacies } = useCollection<Pharmacy>(pharmacyPharmaciesQuery);

  // PHARMACY role: fetches only their own shifts
  const pharmacyShiftsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !userProfile || userProfile.role !== 'pharmacy') return null;
    return query(collection(firestore, 'shifts'), where('userId', '==', user.uid));
  }, [firestore, user, userProfile]);
  const { data: pharmacyShifts, isLoading: isLoadingPharmacyShifts } = useCollection<Shift>(pharmacyShiftsQuery);
  
  // SUBSTITUTE role: fetches ALL pharmacies to display shift details
  const substitutePharmaciesQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile || userProfile.role !== 'substitute') return null;
    return collection(firestore, 'pharmacies');
  }, [firestore, userProfile]);
  const { data: substitutePharmacies, isLoading: isLoadingSubstitutePharmacies } = useCollection<Pharmacy>(substitutePharmaciesQuery);
  
  // SUBSTITUTE role: fetches ALL shifts. We will filter on the client.
  const substituteShiftsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile || userProfile.role !== 'substitute') return null;
     return collection(firestore, 'shifts');
  }, [firestore, userProfile]);
  const { data: substituteShifts, isLoading: isLoadingSubstituteShifts } = useCollection<Shift>(substituteShiftsQuery);

  // This hook is no longer needed as we fetch all shifts and filter client-side
  // const { data: myBookedShifts, isLoading: isLoadingMyBookedShifts } = useCollection<Shift>(...)

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());

  // --- DERIVED STATE: Determine which data to use based on role ---
  const isLoading = isLoadingUserProfile || isLoadingPharmacyPharmacies || isLoadingPharmacyShifts || isLoadingSubstitutePharmacies || isLoadingSubstituteShifts;
  
  const pharmacies = userProfile?.role === 'pharmacy' ? pharmacyPharmacies : substitutePharmacies;
  
  const allShiftsForSubstitute = React.useMemo(() => {
    if (userProfile?.role !== 'substitute' || !substituteShifts || !user) return [];
    // Client-side filtering: show available shifts OR shifts booked by the current user
    return substituteShifts.filter(shift => shift.status === 'available' || shift.bookedBy === user.uid);
  }, [substituteShifts, userProfile, user]);

  const shifts = userProfile?.role === 'pharmacy' ? pharmacyShifts : allShiftsForSubstitute;

  // --- Event Handlers ---
  const handleBookShift = (shiftId: string) => {
    if (!firestore || !user || userProfile?.role !== 'substitute') return;
    const shiftRef = doc(firestore, 'shifts', shiftId);
    updateDocumentNonBlocking(shiftRef, { 
      status: 'booked',
      bookedBy: user.uid
    });
    toast({ title: "Shift Booked!", description: "The shift has been added to your calendar."});
  };

  const handleCancelBooking = (shiftId: string) => {
    if (!firestore || !user || userProfile?.role !== 'substitute') return;
    const shiftRef = doc(firestore, 'shifts', shiftId);
    updateDocumentNonBlocking(shiftRef, {
      status: 'available',
      bookedBy: null
    });
    toast({ title: "Booking Cancelled", description: "The shift is now available again." });
  };

  const handleCreateShift = (newShift: Omit<Shift, 'id' | 'status'>) => {
    if (!firestore || !user || userProfile?.role !== 'pharmacy') return;
    const shiftsCollection = collection(firestore, 'shifts');
    const { date, ...restOfShift } = newShift;
    const dateAsTimestamp = Timestamp.fromDate(new Date(date));
    addDocumentNonBlocking(shiftsCollection, {
      ...restOfShift,
      date: dateAsTimestamp,
      status: 'available',
      userId: user.uid,
    });
  };
  
  const handleCreatePharmacy = (newPharmacy: Omit<Pharmacy, 'id'>) => {
     if (!firestore || !user || userProfile?.role !== 'pharmacy') return { ...newPharmacy, id: ''};
    const pharmaciesCollection = collection(firestore, 'pharmacies');
    addDocumentNonBlocking(pharmaciesCollection, {
      ...newPharmacy,
      userId: user.uid,
    });
    return { ...newPharmacy, id: `ph_${Date.now()}` };
  };

  const handleDeletePharmacy = async (pharmacyId: string) => {
    if (!firestore || userProfile?.role !== 'pharmacy') return;
    
    // This part requires a backend function for atomicity in a real production app.
    // For now, we will proceed but it's not atomic.
    
    deleteDocumentNonBlocking(doc(firestore, 'pharmacies', pharmacyId));

    toast({
        title: 'Pharmacy Deleted',
        description: 'The pharmacy has been deleted. Associated shifts were not deleted.',
        variant: 'destructive',
    });
  };

  const handleSaveProfile = (profileData: Omit<UserProfile, 'id' | 'userId'>) => {
    if (!userProfileRef) return;
    setDocumentNonBlocking(userProfileRef, { ...profileData, userId: userProfileRef.id }, { merge: true });
    toast({
      title: 'Profile Saved',
      description: 'Your profile has been successfully updated.',
    });
  };

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

  if (isLoading || !userProfile) {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center">
            <p>Loading Dashboard...</p>
        </div>
    );
  }

  const isSubstitute = userProfile.role === 'substitute';

  return (
    <>
      <Header 
        pharmacies={pharmacies || []} 
        onCreateShift={handleCreateShift} 
        onCreatePharmacy={handleCreatePharmacy} 
        onDeletePharmacy={handleDeletePharmacy}
        userProfile={userProfile}
        onSaveProfile={handleSaveProfile}
      />
      <div className="container mx-auto grid max-w-7xl grid-cols-1 gap-8 p-4 md:grid-cols-3 lg:grid-cols-5 md:p-6 lg:p-8">
        <div className="lg:col-span-3 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Shift Calendar</CardTitle>
              <CardDescription>
                {isSubstitute
                  ? "Select a day to view available shifts. Days with available shifts are marked."
                  : "Manage your pharmacy's shifts. Days with your shifts are marked."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ShiftCalendar
                shifts={shiftsWithDateObjects}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                ownUserId={isSubstitute ? undefined : user?.uid} // Pass userId only for pharmacies
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
                {isSubstitute
                  ? "Shifts you can book or have already booked."
                  : "All shifts scheduled at your pharmacy for the selected day."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ShiftList
                shifts={shiftsOnSelectedDate}
                pharmacies={pharmacies || []}
                onBookShift={handleBookShift}
                onCancelBooking={handleCancelBooking}
                currentUserId={user?.uid}
                userRole={userProfile.role}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
