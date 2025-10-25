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

    // After loading, if the user is definitely not an admin, they should be redirected.
    // This effect is now more robust.
    React.useEffect(() => {
        if (!isLoading) {
            if (!user || !userProfile || !isAdmin(userProfile)) {
                router.push('/');
            }
        }
    }, [isLoading, user, userProfile, router]);


    // 1. While loading, show a clear loading indicator. This is the only thing rendered until we know the user's status.
    if (isLoading) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center">
                <p>Verifying admin permissions...</p>
            </div>
        );
    }

    // 2. After loading, if the user is an admin, show the dashboard.
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
    
    // 3. If not loading and not an admin (or no profile), show a clear message.
    // The useEffect will handle the redirection. This prevents the dashboard from ever flashing.
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center">
            <p>Access Denied. Redirecting...</p>
        </div>
    );
}
