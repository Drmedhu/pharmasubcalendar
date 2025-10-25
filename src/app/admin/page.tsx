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

    // This is the crucial part: combine loading states.
    const isLoading = isAuthLoading || isProfileLoading;

    React.useEffect(() => {
        // Only run this effect when loading is complete.
        if (!isLoading) {
            // If, after loading, we determine the user is not an admin, redirect.
            if (!user || !userProfile || !isAdmin(userProfile)) {
                router.push('/');
            }
        }
    }, [isLoading, user, userProfile, router]);

    // 1. Render a loading state until all data is available.
    // This prevents the "flicker" because we don't try to render the dashboard or deny access prematurely.
    if (isLoading) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center">
                <p>Verifying admin permissions...</p>
            </div>
        );
    }

    // 2. After loading, if the user is definitely an admin, show the dashboard.
    // This condition is now safe to check because `isLoading` is false.
    if (user && userProfile && isAdmin(userProfile)) {
        return (
            <div className="flex min-h-screen w-full flex-col">
                <PublicHeader />
                <main className="flex-1">
                    <AdminDashboard />
                </main>
            </div>
        );
    }
    
    // 3. If loading is done and they are not an admin, show a persistent message.
    // The useEffect will handle the redirection. This state is shown while the redirect is in progress.
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center">
            <p>Access Denied. Redirecting...</p>
        </div>
    );
}
