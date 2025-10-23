"use client";

import * as React from 'react';
import { useCollection, useFirestore } from '@/firebase';
import type { Shift, UserProfile } from '@/lib/types';
import { collection, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserManagementTab from './user-management-tab';
import ShiftManagementTab from './shift-management-tab';

export function AdminDashboard() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const { data: profiles, isLoading: isLoadingProfiles } = useCollection<UserProfile>(
    firestore ? collection(firestore, 'userProfiles') : null
  );

  const { data: shifts, isLoading: isLoadingShifts } = useCollection<Shift>(
    firestore ? collection(firestore, 'shifts') : null
  );

  const handleCancelBooking = (shiftId: string) => {
    if (!firestore) return;
    const shiftRef = doc(firestore, 'shifts', shiftId);
    updateDocumentNonBlocking(shiftRef, {
      status: 'available',
      bookedBy: null,
    });
    toast({
      title: 'Booking Cancelled',
      description: "The shift is now available again.",
    });
  };

  const isLoading = isLoadingProfiles || isLoadingShifts;

  if (isLoading) {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center">
            <p>Loading admin data...</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <Tabs defaultValue="shifts">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shifts">Shift Management</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>
        <TabsContent value="shifts">
            <ShiftManagementTab 
                shifts={shifts || []}
                profiles={profiles || []}
                onCancelBooking={handleCancelBooking}
            />
        </TabsContent>
        <TabsContent value="users">
            <UserManagementTab profiles={profiles || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
