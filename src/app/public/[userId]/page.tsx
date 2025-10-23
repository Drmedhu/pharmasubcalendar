'use client';
import { PublicDashboard } from '@/components/public-dashboard';
import { Toaster } from '@/components/ui/toaster';

interface PublicPageProps {
  params: {
    userId: string;
  };
}

export default function PublicPage({ params }: PublicPageProps) {
  const { userId } = params;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex-1">
        <PublicDashboard userId={userId} />
      </main>
      <Toaster />
    </div>
  );
}
