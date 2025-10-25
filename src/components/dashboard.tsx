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
import { isAdmin } from '@/lib/admin';
import { AdminDashboard } from './admin/admin-dashboard';
import { MOCK_SHIFTS, MOCK_PROFILES, MOCK_PHARMACIES } from '@/lib/mock-data';

export function Dashboard() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  
  const [allShifts, setAllShifts] = React.useState<Shift[]>(MOCK_SHIFTS);
  const [allProfiles, setAllProfiles] = React.useState<UserProfile[]>(MOCK_PROFILES);
  const [allPharmacies, setAllPharmacies] = React.useState<Pharmacy[]>(MOCK_PHARMACIES);
  
  // 1. Find user profile from mock data.
  const userProfile = React.useMemo(() => {
    if (!user) return null;
    return allProfiles.find(p => p.userId === user.uid);
  }, [user, allProfiles]);

  // 2. Determine roles and admin status from mock profile.
  const userIsAdmin = React.useMemo(() => {
    if (!userProfile) return false;
    return isAdmin(userProfile);
  }, [userProfile]);

  const isPharmacy = userProfile?.role === 'pharmacy';
  const isSubstitute = userProfile?.role === 'substitute';

  // --- DERIVED STATE & MEMOS ---

  const isDashboardLoading = isAuthLoading;

  const allData = React.useMemo(() => {
    if (userIsAdmin) {
      return {
        pharmacies: [], // Admins don't manage their own pharmacies in the main view
        shifts: allShifts,
        profiles: allProfiles,
      };
    }
    if (isPharmacy) {
        return {
            pharmacies: allPharmacies.filter(p => p.userId === user?.uid),
            shifts: allShifts.filter(s => s.userId === user?.uid),
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
  }, [userIsAdmin, isPharmacy, isSubstitute, user?.uid, allShifts, allProfiles, allPharmacies]);

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
    setAllShifts(prevShifts => prevShits.map(shift => 
        shift.id === shiftId ? { ...shift, status: 'available', bookedBy: null } : shift
    ));
    toast({ title: "Booking Cancelled", description: "The shift is now available again." });
  };

  const handleCreateShift = (newShift: Omit<Shift, 'id' | 'status'>) => {
    if (!user || !isPharmacy) return;
    const shiftWithId: Shift = {
        ...newShift,
        id: `shift_${Date.now()}`,
        status: 'available',
        userId: user.uid,
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

  const handleSaveProfile = (profileData: Omit<UserProfile, 'id' | 'userId'>) => {
    if(!user) return;
    setAllProfiles(prev => prev.map(p => p.userId === user.uid ? { ...p, ...profileData } : p));
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
