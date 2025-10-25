"use client";

import * as React from 'react';
import type { Shift, Pharmacy, UserProfile } from '@/lib/types';
import ShiftCalendar from '@/components/shift-calendar';
import ShiftList from '@/components/shift-list';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { Header } from '@/components/header';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useUser, useDoc } from '@/firebase';
import { collection, doc, query, where, Timestamp } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { isAdmin } from '@/lib/admin';
import { AdminDashboard } from './admin/admin-dashboard';


export function Dashboard() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  
  // 1. Fetch user profile first. This is the only query that runs initially.
  const userProfileRef = React.useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  // 2. Determine roles and admin status *after* profile is loaded.
  const userIsAdmin = React.useMemo(() => {
    if (isProfileLoading || !userProfile) return false;
    return isAdmin(userProfile);
  }, [userProfile, isProfileLoading]);

  const isPharmacy = !isProfileLoading && userProfile?.role === 'pharmacy';
  const isSubstitute = !isProfileLoading && userProfile?.role === 'substitute';

  // --- DATA FETCHING (Now dependent on profile loading status) ---
  
  // -- ADMIN DATA --
  const adminProfilesQuery = React.useMemo(() => {
      if (!firestore || !userIsAdmin) return null;
      return collection(firestore, 'userProfiles');
  }, [firestore, userIsAdmin]);
  const { data: adminProfiles } = useCollection<UserProfile>(adminProfilesQuery);

  const adminShiftsQuery = React.useMemo(() => {
      if (!firestore || !userIsAdmin) return null;
      return collection(firestore, 'shifts');
  }, [firestore, userIsAdmin]);
  const { data: adminShifts } = useCollection<Shift>(adminShiftsQuery);


  // -- NON-ADMIN DATA --
  const nonAdminPharmaciesQuery = React.useMemo(() => {
    if (isProfileLoading || !firestore || !user || userIsAdmin) return null;
    if (isPharmacy) return query(collection(firestore, 'pharmacies'), where('userId', '==', user.uid));
    if (isSubstitute) return collection(firestore, 'pharmacies'); 
    return null;
  }, [firestore, user, isProfileLoading, isPharmacy, isSubstitute, userIsAdmin]);
  const { data: nonAdminPharmacies } = useCollection<Pharmacy>(nonAdminPharmaciesQuery);

  const nonAdminShiftsQuery = React.useMemo(() => {
    if (isProfileLoading || !firestore || !user || userIsAdmin) return null;
    if (isPharmacy) return query(collection(firestore, 'shifts'), where('userId', '==', user.uid));
    if (isSubstitute) return collection(firestore, 'shifts'); 
    return null;
  }, [firestore, user, isProfileLoading, isPharmacy, isSubstitute, userIsAdmin]);
  const { data: nonAdminShifts } = useCollection<Shift>(nonAdminShiftsQuery);


  // --- DERIVED STATE & MEMOS ---

  const isDashboardLoading = isAuthLoading || isProfileLoading;

  const allData = React.useMemo(() => {
    if (userIsAdmin) {
      return {
        pharmacies: [], // Admins don't manage their own pharmacies in the main view
        shifts: adminShifts,
        profiles: adminProfiles,
      };
    }
    return {
      pharmacies: nonAdminPharmacies,
      shifts: nonAdminShifts,
      profiles: null,
    };
  }, [userIsAdmin, adminProfiles, adminShifts, nonAdminPharmacies, nonAdminShifts]);

  // --- Event Handlers ---

  const handleBookShift = (shiftId: string) => {
    if (!firestore || !user || !isSubstitute) return;
    const shiftRef = doc(firestore, 'shifts', shiftId);
    updateDocumentNonBlocking(shiftRef, { status: 'booked', bookedBy: user.uid });
    toast({ title: "Shift Booked!", description: "The shift has been added to your calendar."});
  };

  const handleCancelBooking = (shiftId: string) => {
    if (!firestore || !user) return; // Allow substitute and admin
    const shiftRef = doc(firestore, 'shifts', shiftId);
    updateDocumentNonBlocking(shiftRef, { status: 'available', bookedBy: null });
    toast({ title: "Booking Cancelled", description: "The shift is now available again." });
  };

  const handleCreateShift = (newShift: Omit<Shift, 'id' | 'status'>) => {
    if (!firestore || !user || !isPharmacy) return;
    const shiftsCollection = collection(firestore, 'shifts');
    const { date, ...restOfShift } = newShift;
    const dateAsTimestamp = Timestamp.fromDate(new Date(date as string));
    addDocumentNonBlocking(shiftsCollection, { ...restOfShift, date: dateAsTimestamp, status: 'available', userId: user.uid });
  };
  
  const handleCreatePharmacy = (newPharmacy: Omit<Pharmacy, 'id'>) => {
     if (!firestore || !user || !isPharmacy) return { ...newPharmacy, id: ''};
    const pharmaciesCollection = collection(firestore, 'pharmacies');
    addDocumentNonBlocking(pharmaciesCollection, { ...newPharmacy, userId: user.uid });
    return { ...newPharmacy, id: `ph_${Date.now()}` };
  };

  const handleDeletePharmacy = (pharmacyId: string) => {
    if (!firestore || !isPharmacy) return;
    deleteDocumentNonBlocking(doc(firestore, 'pharmacies', pharmacyId));
    toast({ title: 'Pharmacy Deleted', description: 'The pharmacy has been deleted.', variant: 'destructive' });
  };

  const handleSaveProfile = (profileData: Omit<UserProfile, 'id' | 'userId'>) => {
    if (!userProfileRef) return;
    setDocumentNonBlocking(userProfileRef, { ...profileData, userId: userProfileRef.id }, { merge: true });
    toast({ title: 'Profile Saved', description: 'Your profile has been successfully updated.' });
  };

  const shiftsWithDateObjects = React.useMemo(() => {
    return allData.shifts?.map(s => ({ ...s, date: s.date instanceof Timestamp ? s.date.toDate() : new Date(s.date as string) })) || [];
  }, [allData.shifts]);

  const shiftsOnSelectedDate = shiftsWithDateObjects.filter(shift => selectedDate && shift.date.toDateString() === selectedDate.toDateString());

  // --- Render Logic ---

  if (isDashboardLoading) {
    return <div className="flex min-h-screen w-full flex-col items-center justify-center"><p>Loading Dashboard...</p></div>;
  }
  
  if (!userProfile) {
    return <div className="flex min-h-screen w-full flex-col items-center justify-center"><p className='text-destructive'>Error: Could not load user profile. Please try logging out and back in.</p></div>;
  }

  return (
    <>
      <Header 
        pharmacies={allData.pharmacies || []} 
        onCreateShift={handleCreateShift} 
        onCreatePharmacy={handleCreatePharmacy} 
        onDeletePharmacy={handleDeletePharmacy}
        userProfile={userProfile}
        onSaveProfile={handleSaveProfile}
      />
      {userIsAdmin ? (
        <AdminDashboard 
          shifts={allData.shifts || []}
          profiles={allData.profiles || []}
          onCancelBooking={handleCancelBooking}
        />
      ) : (
        <div className="container mx-auto grid max-w-7xl grid-cols-1 gap-8 p-4 md:grid-cols-3 lg:grid-cols-5 md:p-6 lg:p-8">
          <div className="lg:col-span-3 md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Shift Calendar</CardTitle>
                <CardDescription>
                  {isSubstitute ? "Select a day to view available shifts." : "Manage your pharmacy's shifts."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ShiftCalendar
                  shifts={shiftsWithDateObjects}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  userRole={userProfile.role}
                  currentUserId={user?.uid}
                />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2 md:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Shifts for {selectedDate ? format(selectedDate, 'MMMM d') : '...'}</CardTitle>
                <CardDescription>
                  {isSubstitute ? "Shifts you can book or have already booked." : "All shifts for the selected day."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ShiftList
                  shifts={shiftsOnSelectedDate}
                  pharmacies={allData.pharmacies || []}
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

    