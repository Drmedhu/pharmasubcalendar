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
import { useToast } from '@/hooks/use-toast';
import type { Pharmacy } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  address: z.string().min(5, { message: 'Address must be at least 5 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

type CreatePharmacyFormValues = z.infer<typeof formSchema>;

interface CreatePharmacyFormProps {
  onCreatePharmacy: (newPharmacy: Omit<Pharmacy, 'id'>) => Pharmacy;
  onFormSubmit: () => void;
}

export default function CreatePharmacyForm({ onCreatePharmacy, onFormSubmit }: CreatePharmacyFormProps) {
  const { toast } = useToast();
  const form = useForm<CreatePharmacyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
      email: '',
    },
  });

  function onSubmit(values: CreatePharmacyFormValues) {
    const newPharmacy = onCreatePharmacy(values);
    toast({
      title: 'Pharmacy Created',
      description: `The new pharmacy has been successfully created: ${newPharmacy.name}.`,
    });
    onFormSubmit();
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Pharmacy Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="Street, number, city" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notification Email</FormLabel>
              <FormControl>
                <Input placeholder="email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Create Pharmacy</Button>
      </form>
    </Form>
  );
}
