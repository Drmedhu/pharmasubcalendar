import { Briefcase, PlusCircle, Hospital, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import CreateShiftForm from '@/components/create-shift-form';
import type { Pharmacy, Shift } from '@/lib/types';
import * as React from 'react';
import CreatePharmacyForm from './create-pharmacy-form';
import { Separator } from './ui/separator';

interface HeaderProps {
    pharmacies: Pharmacy[];
    onCreateShift: (newShift: Omit<Shift, 'id' | 'status'>) => void;
    onCreatePharmacy: (newPharmacy: Omit<Pharmacy, 'id'>) => Pharmacy;
    onDeletePharmacy: (pharmacyId: string) => void;
}

export function Header({ pharmacies, onCreateShift, onCreatePharmacy, onDeletePharmacy }: HeaderProps) {
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
                Gyógyszertárak
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Gyógyszertárak kezelése</DialogTitle>
                <DialogDescription>
                    Itt kezelheti a gyógyszertárakat. Új gyógyszertár hozzáadása vagy meglévő törlése.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Meglévő gyógyszertárak</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {pharmacies.map(pharmacy => (
                        <div key={pharmacy.id} className="flex items-center justify-between p-2 rounded-md border">
                           <div>
                            <p className="font-medium">{pharmacy.name}</p>
                            <p className="text-sm text-muted-foreground">{pharmacy.address}</p>
                           </div>
                            <Button variant="ghost" size="icon" onClick={() => onDeletePharmacy(pharmacy.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Törlés</span>
                            </Button>
                        </div>
                    ))}
                </div>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Új gyógyszertár létrehozása</h3>
                  <CreatePharmacyForm onCreatePharmacy={onCreatePharmacy} onFormSubmit={() => {}} />
                </div>
              </div>
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
