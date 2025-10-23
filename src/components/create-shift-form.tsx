"use client";

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Pharmacy, Shift } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

const formSchema = z.object({
  pharmacyId: z.string().min(1, { message: 'Please select a pharmacy.' }),
  date: z.date({
    required_error: 'A date is required.',
  }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Invalid time format. Use HH:mm.' }),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Invalid time format. Use HH:mm.' }),
  payRate: z.coerce.number().min(1, { message: 'Pay rate must be a positive number.' }),
  role: z.enum(['pharmacist', 'assistant'], {
    required_error: "You need to select a role.",
  }),
});

type CreateShiftFormValues = z.infer<typeof formSchema>;

interface CreateShiftFormProps {
  pharmacies: Pharmacy[];
  onCreateShift: (newShift: Omit<Shift, 'id' | 'status'>) => void;
  onFormSubmit: () => void;
}

export default function CreateShiftForm({ pharmacies, onCreateShift, onFormSubmit }: CreateShiftFormProps) {
  const { toast } = useToast();
  const form = useForm<CreateShiftFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pharmacyId: '',
      startTime: '',
      endTime: '',
      payRate: 0,
      role: 'pharmacist',
    },
  });

  function onSubmit(values: CreateShiftFormValues) {
    const newShift = {
      ...values,
      date: values.date.toISOString(),
    };
    onCreateShift(newShift);
    toast({
      title: 'Shift Created',
      description: `A new shift has been successfully created.`,
    });
    onFormSubmit();
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="pharmacyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pharmacy</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a pharmacy" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {pharmacies.map((pharmacy) => (
                    <SelectItem key={pharmacy.id} value={pharmacy.id}>
                      {pharmacy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Role</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-4"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="pharmacist" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Pharmacist
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="assistant" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Assistant
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input placeholder="HH:mm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <Input placeholder="HH:mm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="payRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pay Rate (Ft/hr)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Create Shift</Button>
      </form>
    </Form>
  );
}
