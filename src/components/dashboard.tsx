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

// Separate component to handle admin-specific data fetching
function AdminDataLayer({ onDataLoaded, userProfile }: { onDataLoaded: (data: { profiles: UserProfile[], shifts: Shift[] }) => void, userProfile: UserProfile }) {
  const firestore = useFirestore();

  const profilesQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin(userProfile)) return null;
    return collection(firestore, 'userProfiles');
  }, [firestore, userProfile]);
  const { data: profiles, isLoading: isLoadingProfiles } = useCollection<UserProfile>(profilesQuery);

  const shiftsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin(userProfile)) return null;
    return collection(firestore, 'shifts');
  }, [firestore, userProfile]);
  const { data: shifts, isLoading: isLoadingShifts } = useCollection<Shift>(shiftsQuery);

  React.useEffect(() => {
    if (!isLoadingProfiles && !isLoadingShifts && profiles && shifts) {
      onDataLoaded({ profiles, shifts });
    }
  }, [profiles, shifts, isLoadingProfiles, isLoadingShifts, onDataLoaded]);

  return null; // This component does not render anything itself
}


export function Dashboard() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  
  // State for all data, to be populated by specific fetchers
  const [allData, setAllData] = React.useState<{
      pharmacies: Pharmacy[] | null;
      shifts: Shift[] | null;
      profiles: UserProfile[] | null;
  }>({ pharmacies: null, shifts: null, profiles: null });

  const [isDashboardLoading, setDashboardLoading] = React.useState(true);

  // 1. Fetch user profile first
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const userIsAdmin = React.useMemo(() => userProfile ? isAdmin(userProfile) : false, [userProfile]);
  const isPharmacy = userProfile?.role === 'pharmacy';
  const isSubstitute = userProfile?.role === 'substitute';

  // --- NON-ADMIN DATA ---
  const pharmaciesQuery = useMemoFirebase(() => {
    if (isProfileLoading || !firestore || !user || userIsAdmin) return null; // Don't run for admin
    if (isPharmacy) return query(collection(firestore, 'pharmacies'), where('userId', '==', user.uid));
    if (isSubstitute) return collection(firestore, 'pharmacies');
    return null;
  }, [firestore, user, isProfileLoading, isPharmacy, isSubstitute, userIsAdmin]);
  const { data: nonAdminPharmacies, isLoading: isLoadingNonAdminPharmacies } = useCollection<Pharmacy>(pharmaciesQuery);

  const shiftsQuery = useMemoFirebase(() => {
    if (isProfileLoading || !firestore || !user || userIsAdmin) return null; // Don't run for admin
    if (isPharmacy) return query(collection(firestore, 'shifts'), where('userId', '==', user.uid));
    if (isSubstitute) return collection(firestore, 'shifts');
    return null;
  }, [firestore, user, isProfileLoading, isPharmacy, isSubstitute, userIsAdmin]);
  const { data: nonAdminShifts, isLoading: isLoadingNonAdminShifts } = useCollection<Shift>(shiftsQuery);
  
  // --- DATA LOADING EFFECT ---
  React.useEffect(() => {
     if (isAuthLoading || isProfileLoading) {
        setDashboardLoading(true);
        return;
     }
     if (userIsAdmin) {
        // Admin loading is handled by the AdminDataLayer and onDataLoaded callback
        setDashboardLoading(true); // Keep loading until admin data arrives
     } else {
        if (!isLoadingNonAdminPharmacies && !isLoadingNonAdminShifts) {
            setAllData({
                pharmacies: nonAdminPharmacies,
                shifts: nonAdminShifts,
                profiles: null, // Not needed for non-admins
            });
            setDashboardLoading(false);
        }
     }
  }, [
      isAuthLoading, isProfileLoading, userIsAdmin, 
      isLoadingNonAdminPharmacies, isLoadingNonAdminShifts,
      nonAdminPharmacies, nonAdminShifts
  ]);

  const handleAdminDataLoaded = React.useCallback(({ profiles, shifts }: { profiles: UserProfile[], shifts: Shift[] }) => {
      setAllData({
          pharmacies: [], // Admin doesn't manage their own pharmacies in this view
          shifts: shifts,
          profiles: profiles,
      });
      setDashboardLoading(false);
  }, []);

  // --- Event Handlers ---

  const handleBookShift = (shiftId: string) => {
    if (!firestore || !user || !isSubstitute) return;
    const shiftRef = doc(firestore, 'shifts', shiftId);
    updateDocumentNonBlocking(shiftRef, { status: 'booked', bookedBy: user.uid });
    toast({ title: "Shift Booked!", description: "The shift has been added to your calendar."});
  };

  const handleCancelBooking = (shiftId: string) => {
    if (!firestore || !user) return; // Allow both substitute and admin
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
      {/* This component will fetch admin data only when needed */}
      {userIsAdmin && <AdminDataLayer onDataLoaded={handleAdminDataLoaded} userProfile={userProfile} />}

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
                  ownUserId={isPharmacy ? user?.uid : undefined}
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
