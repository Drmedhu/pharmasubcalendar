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

    const isLoading = isAuthLoading || isProfileLoading;

    React.useEffect(() => {
        // Only run redirection logic after all loading is complete.
        if (!isLoading) {
            // After loading, if there is no user, no profile, or the user is not an admin, redirect.
            if (!user || !userProfile || !isAdmin(userProfile)) {
                router.push('/');
            }
        }
    }, [isLoading, user, userProfile, router]);
    
    // While loading, or if the user data is not yet available, show a loading screen.
    if (isLoading) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center">
                <p>Verifying admin permissions...</p>
            </div>
        );
    }
    
    // After loading, if they are not an admin (and not loading), they will be redirected. 
    // We can show a message until the redirect happens.
    if (!isAdmin(userProfile)) {
         return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center">
                <p>Access denied. Redirecting...</p>
            </div>
        );
    }
    
    // If all checks pass, render the admin dashboard.
    return (
        <div className="flex min-h-screen w-full flex-col">
            <PublicHeader />
            <main className="flex-1">
                <AdminDashboard />
            </main>
        </div>
    );
}
