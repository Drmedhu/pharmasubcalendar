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
        // Ne tegyen semmit, amíg az adatok töltődnek.
        if (isLoading) {
            return;
        }

        // A betöltés után, ha a felhasználó nincs bejelentkezve, nincs profilja,
        // vagy a profilja alapján nem admin, akkor átirányítjuk.
        if (!user || !userProfile || !isAdmin(userProfile)) {
            router.push('/');
        }
    }, [isLoading, user, userProfile, router]);


    // 1. Amíg töltünk, egyértelmű betöltési üzenetet mutatunk.
    // Ez az egyetlen, ami renderelődik, amíg nem tudjuk a felhasználó státuszát.
    if (isLoading) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center">
                <p>Verifying admin permissions...</p>
            </div>
        );
    }

    // 2. A betöltés után, ha a felhasználó admin, megjelenítjük a dashboardot.
    // Ez az ellenőrzés most már biztonságos, mert `isLoading` értéke hamis,
    // tehát a `user` és `userProfile` adatok már rendelkezésre állnak.
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
    
    // 3. Ha nem töltünk és nem admin (vagy nincs profil), egyértelmű üzenetet mutatunk.
    // A useEffect kezeli az átirányítást. Ez megakadályozza a dashboard felvillanását.
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center">
            <p>Access Denied. Redirecting...</p>
        </div>
    );
}
