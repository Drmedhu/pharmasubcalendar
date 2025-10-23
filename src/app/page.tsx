'use client';
import { Dashboard } from '@/components/dashboard';
import { Toaster } from '@/components/ui/toaster';
import { useUser, useAuth } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useEffect } from 'react';

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  useEffect(() => {
    if (!user && !isUserLoading) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex-1">
        <Dashboard />
      </main>
      <Toaster />
    </div>
  );
}
