import { Briefcase, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import CreateShiftForm from '@/components/create-shift-form';
import type { Pharmacy, Shift } from '@/lib/types';
import * as React from 'react';

interface HeaderProps {
    pharmacies: Pharmacy[];
    onCreateShift: (newShift: Omit<Shift, 'id' | 'status'>) => void;
}

export function Header({ pharmacies, onCreateShift }: HeaderProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Briefcase className="h-7 w-7 text-primary" />
          <h1 className="font-headline text-xl font-bold text-foreground">
            PharmaSub Calendar
          </h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
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
            <CreateShiftForm pharmacies={pharmacies} onCreateShift={onCreateShift} onFormSubmit={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
