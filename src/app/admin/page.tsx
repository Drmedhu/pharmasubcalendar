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
    const isUserAdmin = !isLoading && !!userProfile && isAdmin(userProfile);

    React.useEffect(() => {
        // We only want to redirect if loading is complete and the user is definitively not an admin.
        if (!isLoading && !isUserAdmin) {
            router.push('/');
        }
    }, [isLoading, isUserAdmin, router]);

    // 1. While loading, show a loading indicator.
    if (isLoading) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center">
                <p>Verifying admin permissions...</p>
            </div>
        );
    }
    
    // 2. After loading, if they are an admin, show the dashboard.
    if (isUserAdmin) {
        return (
            <div className="flex min-h-screen w-full flex-col">
                <PublicHeader />
                <main className="flex-1">
                    <AdminDashboard />
                </main>
            </div>
        );
    }

    // 3. After loading, if they are NOT an admin, they will be redirected by the useEffect.
    // Show a message until the redirect happens.
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center">
            <p>Access denied. Redirecting...</p>
        </div>
    );
}
