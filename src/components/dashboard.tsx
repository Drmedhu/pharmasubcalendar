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
import { AdminDashboard } from './admin/admin-dashboard';

export function Dashboard() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());

  // 1. Fetch User Profile First, it will drive all other queries.
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  // --- DERIVED STATE ---
  const isPharmacy = userProfile?.role === 'pharmacy';
  const isSubstitute = userProfile?.role === 'substitute';
  const userIsAdmin = isAdmin(userProfile);

  // --- QUERIES (conditionally enabled) ---
  
  // PHARMACY role queries
  const pharmacyPharmaciesQuery = useMemoFirebase(() => {
    if (!firestore || !user || !isPharmacy) return null;
    return query(collection(firestore, 'pharmacies'), where('userId', '==', user.uid));
  }, [firestore, user, isPharmacy]);
  const { data: pharmacyPharmacies, isLoading: isLoadingPharmacyPharmacies } = useCollection<Pharmacy>(pharmacyPharmaciesQuery);

  const pharmacyShiftsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !isPharmacy) return null;
    return query(collection(firestore, 'shifts'), where('userId', '==', user.uid));
  }, [firestore, user, isPharmacy]);
  const { data: pharmacyShifts, isLoading: isLoadingPharmacyShifts } = useCollection<Shift>(pharmacyShiftsQuery);
  
  // SUBSTITUTE role queries
  const substitutePharmaciesQuery = useMemoFirebase(() => {
    if (!firestore || !isSubstitute) return null;
    return collection(firestore, 'pharmacies');
  }, [firestore, isSubstitute]);
  const { data: substitutePharmacies, isLoading: isLoadingSubstitutePharmacies } = useCollection<Pharmacy>(substitutePharmaciesQuery);
  
  const substituteShiftsQuery = useMemoFirebase(() => {
    if (!firestore || !isSubstitute) return null;
     return collection(firestore, 'shifts');
  }, [firestore, isSubstitute]);
  const { data: substituteShifts, isLoading: isLoadingSubstituteShifts } = useCollection<Shift>(substituteShiftsQuery);


  // Determine final loading state based on auth, profile, and role-specific data.
  const isLoading = React.useMemo(() => {
    if (isAuthLoading || isProfileLoading) return true;
    if (!userProfile) return true; // Profile is essential, if it's not loaded, we are loading.

    if (userIsAdmin) return false; // Admin view has its own loading state

    if (isPharmacy) {
      return isLoadingPharmacyPharmacies || isLoadingPharmacyShifts;
    }
    if (isSubstitute) {
      return isLoadingSubstitutePharmacies || isLoadingSubstituteShifts;
    }
    return false; // Default case
  }, [isAuthLoading, isProfileLoading, userProfile, isPharmacy, isSubstitute, userIsAdmin, isLoadingPharmacyPharmacies, isLoadingPharmacyShifts, isLoadingSubstitutePharmacies, isLoadingSubstituteShifts]);

  // --- DERIVED DATA: Determine which data to use based on role ---
  const pharmacies = isPharmacy ? pharmacyPharmacies : substitutePharmacies;
  const shifts = isPharmacy ? pharmacyShifts : substituteShifts;

  // --- Event Handlers ---
  const handleBookShift = (shiftId: string) => {
    if (!firestore || !user || !isSubstitute) return;
    const shiftRef = doc(firestore, 'shifts', shiftId);
    updateDocumentNonBlocking(shiftRef, { 
      status: 'booked',
      bookedBy: user.uid
    });
    toast({ title: "Shift Booked!", description: "The shift has been added to your calendar."});
  };

  const handleCancelBooking = (shiftId: string) => {
    if (!firestore || !user || !isSubstitute) return;
    const shiftRef = doc(firestore, 'shifts', shiftId);
    updateDocumentNonBlocking(shiftRef, {
      status: 'available',
      bookedBy: null
    });
    toast({ title: "Booking Cancelled", description: "The shift is now available again." });
  };

  const handleCreateShift = (newShift: Omit<Shift, 'id' | 'status'>) => {
    if (!firestore || !user || !isPharmacy) return;
    const shiftsCollection = collection(firestore, 'shifts');
    const { date, ...restOfShift } = newShift;
    const dateAsTimestamp = Timestamp.fromDate(new Date(date as string));
    addDocumentNonBlocking(shiftsCollection, {
      ...restOfShift,
      date: dateAsTimestamp,
      status: 'available',
      userId: user.uid,
    });
  };
  
  const handleCreatePharmacy = (newPharmacy: Omit<Pharmacy, 'id'>) => {
     if (!firestore || !user || !isPharmacy) return { ...newPharmacy, id: ''};
    const pharmaciesCollection = collection(firestore, 'pharmacies');
    addDocumentNonBlocking(pharmaciesCollection, {
      ...newPharmacy,
      userId: user.uid,
    });
    return { ...newPharmacy, id: `ph_${Date.now()}` };
  };

  const handleDeletePharmacy = (pharmacyId: string) => {
    if (!firestore || !isPharmacy) return;
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

  if (isLoading) {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center">
            <p>Loading Dashboard...</p>
        </div>
    );
  }
  
  if (!userProfile) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <p className='text-destructive'>Error: Could not load user profile. Please try logging out and back in.</p>
      </div>
    )
  }

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
      {userIsAdmin ? (
        <AdminDashboard />
      ) : (
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
                  ownUserId={isPharmacy ? user?.uid : undefined}
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
      )}
    </>
  );
}
