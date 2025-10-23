import { Header } from '@/components/header';
import { Dashboard } from '@/components/dashboard';
import { shifts, pharmacies } from '@/lib/data';
import { Toaster } from '@/components/ui/toaster';

export default function HomePage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex-1">
        <Dashboard initialShifts={shifts} pharmacies={pharmacies} />
      </main>
      <Toaster />
    </div>
  );
}
