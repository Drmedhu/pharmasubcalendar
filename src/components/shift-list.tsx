"use client";

import type { Shift, Pharmacy } from '@/lib/types';
import ShiftCard from '@/components/shift-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import React from 'react';

interface ShiftListProps {
  shifts: Shift[];
  pharmacies: Pharmacy[];
  onBookShift: (shiftId: string) => void;
}

export default function ShiftList({ shifts, pharmacies, onBookShift }: ShiftListProps) {
  if (shifts.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-md border border-dashed bg-muted/50">
        <p className="text-sm text-muted-foreground">No shifts for this day.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[32rem]">
      <div className="flex flex-col gap-4 pr-4">
        {shifts.map((shift) => {
          const pharmacy = pharmacies.find((p) => p.id === shift.pharmacyId);
          return (
            <React.Fragment key={shift.id}>
              <ShiftCard
                shift={shift}
                pharmacy={pharmacy}
                onBookShift={onBookShift}
              />
              <Separator className="last:hidden" />
            </React.Fragment>
          );
        })}
      </div>
    </ScrollArea>
  );
}
