import { Briefcase, PlusCircle, Hospital, Trash2, Share2, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import CreateShiftForm from '@/components/create-shift-form';
import type { Pharmacy, Shift, UserProfile } from '@/lib/types';
import * as React from 'react';
import CreatePharmacyForm from './create-pharmacy-form';
import { Separator } from './ui/separator';
import { useUser as useAuthUser } from '@/firebase';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import ProfileForm from './profile-form';
import Link from 'next/link';
import { isAdmin } from '@/lib/admin';

interface HeaderProps {
    pharmacies: Pharmacy[];
    onCreateShift: (newShift: Omit<Shift, 'id' | 'status'>) => void;
    onCreatePharmacy: (newPharmacy: Omit<Pharmacy, 'id'>) => Pharmacy;
    onDeletePharmacy: (pharmacyId: string) => void;
    userProfile: UserProfile | null;
    onSaveProfile: (profileData: Omit<UserProfile, 'id' | 'userId'>) => void;
}

export function Header({ pharmacies, onCreateShift, onCreatePharmacy, onDeletePharmacy, userProfile, onSaveProfile }: HeaderProps) {
  const [shiftDialogOpen, setShiftDialogOpen] = React.useState(false);
  const [pharmacyDialogOpen, setPharmacyDialogOpen] = React.useState(false);
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = React.useState(false);
  
  const { user } = useAuthUser();
  const { toast } = useToast();

  const shareUrl = React.useMemo(() => {
    if (typeof window !== 'undefined' && user) {
      return `${window.location.origin}/public/${user.uid}`;
    }
    return '';
  }, [user]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
        toast({
            title: 'Link Copied!',
            description: 'The public calendar link has been copied to your clipboard.',
        });
    });
  };

  const userIsAdmin = isAdmin(user?.uid);

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
          {userIsAdmin && (
             <Button asChild variant="destructive">
                <Link href="/admin">
                    <Shield className="mr-2 h-4 w-4" />
                    Admin
                </Link>
             </Button>
          )}

          <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <User className="mr-2 h-4 w-4" />
                My Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>My Profile</DialogTitle>
                    <DialogDescription>
                        Manage your personal information. This will be used when you book a shift.
                    </DialogDescription>
                </DialogHeader>
                <ProfileForm userProfile={userProfile} onSave={onSaveProfile} onFormSubmit={() => setProfileDialogOpen(false)} />
            </DialogContent>
          </Dialog>

          <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Share Your Calendar</DialogTitle>
                <DialogDescription>
                  Anyone with this link will be able to view your calendar.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center space-x-2">
                <Input value={shareUrl} readOnly />
                <Button onClick={copyToClipboard} size="sm" className='shrink-0'>
                  Copy Link
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={pharmacyDialogOpen} onOpenChange={setPharmacyDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Hospital className="mr-2 h-4 w-4" />
                Pharmacies
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Manage Pharmacies</DialogTitle>
                <DialogDescription>
                    Here you can manage pharmacies. Add a new pharmacy or delete an existing one.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Existing Pharmacies</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {pharmacies.map(pharmacy => (
                        <div key={pharmacy.id} className="flex items-center justify-between p-2 rounded-md border">
                           <div>
                            <p className="font-medium">{pharmacy.name}</p>
                            <p className="text-sm text-muted-foreground">{pharmacy.address}</p>
                           </div>
                            <Button variant="ghost" size="icon" onClick={() => onDeletePharmacy(pharmacy.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Delete</span>
                            </Button>
                        </div>
                    ))}
                </div>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Create New Pharmacy</h3>
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
