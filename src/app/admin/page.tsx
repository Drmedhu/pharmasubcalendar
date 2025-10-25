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
        // Only run redirection logic after all loading is complete.
        if (!isLoading) {
            // If there is no logged-in user, or if the profile has loaded and the user is NOT an admin, redirect.
            if (!user || (userProfile && !isUserAdmin)) {
                router.push('/');
            }
            // Also handles the case where the profile document doesn't exist after loading.
            else if (!userProfile) {
                router.push('/');
            }
        }
    }, [isLoading, user, userProfile, isUserAdmin, router]);
    
    // Show a loading screen while we verify auth and profile.
    // This state is also shown if the user is not an admin, just before the redirect happens.
    if (isLoading || !isUserAdmin) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center">
                <p>Verifying admin permissions...</p>
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
