"use client";

import * as React from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { isAdmin } from '@/lib/admin';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { useRouter } from 'next/navigation';
import { PublicHeader } from '@/components/public-header';
import type { UserProfile } from '@/lib/types';
import { doc } from 'firebase/firestore';

export default function AdminPage() {
    const { user, isUserLoading: isAuthLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'userProfiles', user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    const isUserAdmin = React.useMemo(() => isAdmin(userProfile), [userProfile]);
    const isLoading = isAuthLoading || isProfileLoading;

    React.useEffect(() => {
        // Wait until loading is finished to make a decision
        if (!isLoading) {
            // If there's no user logged in, or if the user profile has loaded and they are not an admin
            if (!user || (userProfile && !isUserAdmin)) {
                router.push('/');
            } else if (!userProfile && !isLoading) { // Specifically handle case where profile doesn't exist after loading
                 router.push('/');
            }
        }
    }, [user, userProfile, isUserAdmin, isLoading, router]);
    
    // Show a loading screen while we verify auth and profile
    if (isLoading || !userProfile || !isUserAdmin) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center">
                <p>Verifying admin permissions...</p>
            </div>
        );
    }
    
    // If all checks pass, render the admin dashboard
    return (
        <div className="flex min-h-screen w-full flex-col">
            <PublicHeader />
            <main className="flex-1">
                <AdminDashboard />
            </main>
        </div>
    );
}
