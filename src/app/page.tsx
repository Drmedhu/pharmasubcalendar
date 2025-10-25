'use client';
import { Dashboard } from '@/components/dashboard';
import { Toaster } from '@/components/ui/toaster';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Redirect only when loading is complete and there's no user.
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // While loading, show a generic loading screen.
  // This prevents the Dashboard from trying to render with incomplete auth data.
  if (isUserLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Only render the Dashboard if there IS a user.
  // This ensures the Dashboard and its child components always receive a valid user session.
  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex-1">
        {user ? <Dashboard /> : <div className="flex min-h-screen w-full flex-col items-center justify-center"><p>Redirecting to login...</p></div>}
      </main>
      <Toaster />
    </div>
  );
}
