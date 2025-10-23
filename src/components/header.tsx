import { Briefcase, PlusCircle, Hospital } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import CreateShiftForm from '@/components/create-shift-form';
import type { Pharmacy, Shift } from '@/lib/types';
import * as React from 'react';
import CreatePharmacyForm from './create-pharmacy-form';

interface HeaderProps {
    pharmacies: Pharmacy[];
    onCreateShift: (newShift: Omit<Shift, 'id' | 'status'>) => void;
    onCreatePharmacy: (newPharmacy: Omit<Pharmacy, 'id'>) => void;
}

export function Header({ pharmacies, onCreateShift, onCreatePharmacy }: HeaderProps) {
  const [shiftDialogOpen, setShiftDialogOpen] = React.useState(false);
  const [pharmacyDialogOpen, setPharmacyDialogOpen] = React.useState(false);

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Briefcase className="h-7 w-7 text-primary" />
          <h1 className="font-headline text-xl font-bold text-foreground">
            PharmaSub Calendar
          </h1>
        </div>
        <div className='flex gap-2'>
          <Dialog open={pharmacyDialogOpen} onOpenChange={setPharmacyDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Hospital className="mr-2 h-4 w-4" />
                Új gyógyszertár
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Új gyógyszertár létrehozása</DialogTitle>
              </DialogHeader>
              <CreatePharmacyForm onCreatePharmacy={onCreatePharmacy} onFormSubmit={() => setPharmacyDialogOpen(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={shiftDialogOpen} onOpenChange={setShiftDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Shift
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Shift</DialogTitle>
              </DialogHeader>
              <CreateShiftForm pharmacies={pharmacies} onCreateShift={onCreateShift} onFormSubmit={() => setShiftDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
