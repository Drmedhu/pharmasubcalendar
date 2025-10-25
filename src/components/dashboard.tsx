"use client";

import * as React from 'react';
import type { Shift, Pharmacy, UserProfile } from '@/lib/types';
import ShiftCalendar from '@/components/shift-calendar';
import ShiftList from '@/components/shift-list';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { Header } from '@/components/header';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { Timestamp } from 'firebase/firestore';
import { ADMIN_EMAIL, isAdmin } from '@/lib/admin';
import { AdminDashboard } from './admin/admin-dashboard';
import { MOCK_SHIFTS, MOCK_PROFILES, MOCK_PHARMACIES } from '@/lib/mock-data';

export function Dashboard() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  
  const [allShifts, setAllShifts] = React.useState<Shift[]>(MOCK_SHIFTS);
  const [allProfiles, setAllProfiles] = React.useState<UserProfile[]>(MOCK_PROFILES);
  const [allPharmacies, setAllPharmacies] = React.useState<Pharmacy[]>(MOCK_PHARMACIES);
  
  const userIsAdmin = React.useMemo(() => {
    return user?.email === ADMIN_EMAIL;
  }, [user]);

  const userProfile: UserProfile | null = React.useMemo(() => {
    if (!user) return null;
    if (userIsAdmin) {
      return allProfiles.find(p => p.email === ADMIN_EMAIL) || null;
    }
    // For non-admin users, since we are using mock data and can't match UID,
    // let's just assign a mock role for demonstration.
    // Let's cycle through the mock profiles for different users.
    // A real app would fetch the profile based on user.uid.
    const nonAdminProfiles = allProfiles.filter(p => p.role !== 'admin');
    if (nonAdminProfiles.length > 0) {
        // A simple hash to pick a profile.
        const index = user.uid.charCodeAt(0) % nonAdminProfiles.length;
        const profile = nonAdminProfiles[index];
        // Let's override the mock email/id with the real user's details
        return {
            ...profile,
            userId: user.uid,
            email: user.email!,
        };
    }
    return null;
  }, [user, allProfiles, userIsAdmin]);


  const isPharmacy = userProfile?.role === 'pharmacy';
  const isSubstitute = userProfile?.role === 'substitute';

  // --- DERIVED STATE & MEMOS ---

  const isDashboardLoading = isAuthLoading;

  const allData = React.useMemo(() => {
    if (userIsAdmin) {
      return {
        pharmacies: allPharmacies,
        shifts: allShifts,
        profiles: allProfiles.filter(p => p.role !== 'admin'),
      };
    }
    if (isPharmacy) {
        // In mock mode, a pharmacy user sees shifts from their assigned mock pharmacy
        const userPharmacy = allPharmacies.find(p => p.userId === userProfile?.id);
        return {
            pharmacies: userPharmacy ? [userPharmacy] : [],
            shifts: allShifts.filter(s => s.userId === userPharmacy?.id),
            profiles: null,
        }
    }
    if (isSubstitute) {
        return {
            pharmacies: allPharmacies,
            shifts: allShifts,
            profiles: null,
        }
    }
    return {
      pharmacies: [],
      shifts: [],
      profiles: null,
    };
  }, [userIsAdmin, isPharmacy, isSubstitute, userProfile, allShifts, allProfiles, allPharmacies]);

  // --- Event Handlers ---

  const handleBookShift = (shiftId: string) => {
    if (!user || !isSubstitute) return;
    setAllShifts(prevShifts => prevShifts.map(shift => 
        shift.id === shiftId ? { ...shift, status: 'booked', bookedBy: user.uid } : shift
    ));
    toast({ title: "Shift Booked!", description: "The shift has been added to your calendar."});
  };

  const handleCancelBooking = (shiftId: string) => {
    if (!user) return; 
    setAllShifts(prevShifts => prevShifts.map(shift => 
        shift.id === shiftId ? { ...shift, status: 'available', bookedBy: null } : shift
    ));
    toast({ title: "Booking Cancelled", description: "The shift is now available again." });
  };

  const handleCreateShift = (newShift: Omit<Shift, 'id' | 'status'>) => {
    if (!user || !isPharmacy || !allData.pharmacies || allData.pharmacies.length === 0) return;
    const shiftWithId: Shift = {
        ...newShift,
        id: `shift_${Date.now()}`,
        status: 'available',
        userId: newShift.pharmacyId, // In mock data, pharmacyId is the key
    }
    setAllShifts(prevShifts => [...prevShifts, shiftWithId]);
  };
  
  const handleCreatePharmacy = (newPharmacy: Omit<Pharmacy, 'id'>) => {
     if (!user || !isPharmacy) return { ...newPharmacy, id: ''};
    const pharmacyWithId: Pharmacy = {
        ...newPharmacy,
        id: `ph_${Date.now()}`,
        userId: user.uid,
    }
    setAllPharmacies(prevPharmacies => [...prevPharmacies, pharmacyWithId]);
    return pharmacyWithId;
  };

  const handleDeletePharmacy = (pharmacyId: string) => {
    if (!isPharmacy) return;
    setAllPharmacies(prev => prev.filter(p => p.id !== pharmacyId));
    toast({ title: 'Pharmacy Deleted', description: 'The pharmacy has been deleted.', variant: 'destructive' });
  };

  const handleSaveProfile = (profileData: Omit<UserProfile, 'id' | 'userId' | 'email'>) => {
    if(!userProfile) return;
    setAllProfiles(prev => prev.map(p => p.id === userProfile.id ? { ...p, ...profileData } : p));
    toast({ title: 'Profile Saved', description: 'Your profile has been successfully updated.' });
  };

  const shiftsWithDateObjects = React.useMemo(() => {
    const shiftsToDisplay = allData.shifts || [];
    return shiftsToDisplay.map(s => ({ ...s, date: s.date instanceof Timestamp ? s.date.toDate() : new Date(s.date as string) }));
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
          shifts={shiftsWithDateObjects || []}
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
                  pharmacies={allData.pharmacies || allPharmacies}
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
