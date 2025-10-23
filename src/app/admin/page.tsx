"use client";

import * as React from 'react';
import { useUser } from '@/firebase';
import { isAdmin } from '@/lib/admin';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { useRouter } from 'next/navigation';
import { PublicHeader } from '@/components/public-header';

export default function AdminPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    React.useEffect(() => {
        if (!isUserLoading && !isAdmin(user)) {
            router.push('/');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user || !isAdmin(user)) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center">
                <p>Loading or redirecting...</p>
            </div>
        );
    }
    
    return (
        <div className="flex min-h-screen w-full flex-col">
            <PublicHeader />
            <main className="flex-1">
                <AdminDashboard />
            </main>
        </div>
    );
}
