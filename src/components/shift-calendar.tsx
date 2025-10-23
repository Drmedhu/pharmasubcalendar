"use client";

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import type { Shift } from '@/lib/types';
import { DayPicker } from 'react-day-picker';

interface ShiftCalendarProps {
  shifts: Shift[];
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
}

export default function ShiftCalendar({ shifts, selectedDate, setSelectedDate }: ShiftCalendarProps) {
  const availableShiftDays = React.useMemo(() => {
    return shifts
      .filter((shift) => shift.status === 'available')
      .map((shift) => new Date(shift.date as string));
  }, [shifts]);

  const DayContent: React.ComponentType<React.PropsWithChildren<{ date: Date }>> = (props) => {
    const isAvailable = availableShiftDays.some(
      (d) => d.toDateString() === props.date.toDateString()
    );
    return (
      <div className="relative flex h-full w-full items-center justify-center">
        <span>{props.date.getDate()}</span>
        {isAvailable && (
          <div className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-primary" />
        )}
      </div>
    );
  };
  
  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={setSelectedDate}
      className="w-full p-0"
      classNames={{
        cell: "h-12 w-16 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: "h-12 w-16 p-0 font-normal aria-selected:opacity-100",
        head_cell: "text-muted-foreground rounded-md w-16 font-normal text-[0.8rem]",
      }}
      components={{
        DayContent
      }}
    />
  );
}
