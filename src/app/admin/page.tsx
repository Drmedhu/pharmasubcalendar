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

    // Combine loading states
    const isLoading = isAuthLoading || isProfileLoading;

    React.useEffect(() => {
        // Only run logic when loading is complete
        if (!isLoading) {
            // If there's no user, or the profile doesn't exist, or the user is not an admin, redirect.
            if (!user || !userProfile || !isAdmin(userProfile)) {
                router.push('/');
            }
        }
    }, [isLoading, user, userProfile, router]);

    // 1. While loading, show a clear loading indicator.
    if (isLoading) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center">
                <p>Verifying admin permissions...</p>
            </div>
        );
    }

    // 2. After loading, if the user is an admin, show the dashboard.
    // The useEffect above will handle redirection for non-admins, so we just need to check for admin status here.
    if (userProfile && isAdmin(userProfile)) {
        return (
            <div className="flex min-h-screen w-full flex-col">
                <PublicHeader />
                <main className="flex-1">
                    <AdminDashboard />
                </main>
            </div>
        );
    }
    
    // 3. If not loading and not an admin, show a redirecting message.
    // This state will be briefly visible before the useEffect kicks in.
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center">
            <p>Access Denied. Redirecting...</p>
        </div>
    );
}
