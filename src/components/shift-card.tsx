"use client";

import type { Shift, Pharmacy, UserProfile } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Clock, DollarSign, MapPin, CheckCircle2, UserCircle2, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface ShiftCardProps {
  shift: Shift;
  pharmacy?: Pharmacy;
  onBookShift: (shiftId: string) => void;
  onCancelBooking?: (shiftId: string) => void;
  currentUserId?: string;
  userRole?: UserProfile['role'];
  isPublicView?: boolean;
}

export default function ShiftCard({ shift, pharmacy, onBookShift, onCancelBooking, currentUserId, userRole, isPublicView = false }: ShiftCardProps) {
  const { toast } = useToast();

  const handleConfirmBooking = () => {
    onBookShift(shift.id);
  };

  const handleConfirmCancel = () => {
    if (onCancelBooking) {
        onCancelBooking(shift.id);
    }
  }
  
  const shiftDate = shift.date instanceof Date ? shift.date : (shift.date as Timestamp).toDate();
  const isBookedByCurrentUser = shift.status === 'booked' && shift.bookedBy === currentUserId;

  const canBook = userRole === 'substitute' && shift.status === 'available';

  if (!userRole && !isPublicView) {
    return null; // Don't render if role is not determined yet, unless it's a public view
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-headline font-semibold">{pharmacy?.name || 'Pharmacy'}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span>{pharmacy?.address || '...'}</span>
          </div>
        </div>
        {shift.status === 'available' ? (
          <Badge variant="outline" className="border-primary text-primary shrink-0">Available</Badge>
        ) : (
          <Badge variant="secondary" className="shrink-0">Booked</Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <div className="flex items-center gap-2">
          <UserCircle2 className="h-4 w-4 text-muted-foreground" />
          <span className="capitalize">{shift.role}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{shift.startTime} - {shift.endTime}</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-foreground">{shift.payRate} Ft/hr</span>
        </div>
      </div>
      
      {!isPublicView && (
        <>
            {canBook && (
                <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button size="sm" className="mt-2">
                    Book Shift
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Booking</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div>
                        Are you sure you want to book this shift?
                        <div className="mt-4 rounded-md border bg-muted/50 p-4 text-sm text-foreground">
                            <p className='flex items-center gap-2'><strong className="w-20">Pharmacy:</strong> {pharmacy?.name}</p>
                            <p className='flex items-center gap-2'><strong className="w-20">Role:</strong> <span className='capitalize'>{shift.role}</span></p>
                            <p className='flex items-center gap-2'><strong className="w-20">Date:</strong> {format(shiftDate, 'EEEE, MMMM d, yyyy')}</p>
                            <p className='flex items-center gap-2'><strong className="w-20">Time:</strong> {shift.startTime} - {shift.endTime}</p>
                            <p className='flex items-center gap-2'><strong className="w-20">Pay:</strong> {shift.payRate} Ft/hr</p>
                        </div>
                        </div>
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmBooking}>
                        Confirm
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
            )}

            {isBookedByCurrentUser && (
                <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" className="mt-2">
                        <Ban className='mr-2 h-4 w-4' />
                    Cancel Booking
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Booking Confirmation</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div>
                        Are you sure you want to cancel your booking for this shift? The pharmacy will be notified and the shift will become available again.
                        </div>
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Keep it</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmCancel}>
                        Yes, Cancel Booking
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
            )}
        </>
      )}
    </div>
  );
}

    