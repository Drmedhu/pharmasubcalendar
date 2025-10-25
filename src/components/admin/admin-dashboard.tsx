"use client";

import * as React from 'react';
import type { Shift, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserManagementTab from './user-management-tab';
import ShiftManagementTab from './shift-management-tab';

interface AdminDashboardProps {
    profiles: UserProfile[];
    shifts: Shift[];
    onCancelBooking: (shiftId: string) => void;
}

export function AdminDashboard({ profiles, shifts, onCancelBooking }: AdminDashboardProps) {
  
  if (!profiles || !shifts) {
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
                onCancelBooking={onCancelBooking}
            />
        </TabsContent>
        <TabsContent value="users">
            <UserManagementTab profiles={profiles || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
