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
  name: z.string().min(2, { message: 'A névnek legalább 2 karakter hosszúnak kell lennie.' }),
  address: z.string().min(5, { message: 'A címnek legalább 5 karakter hosszúnak kell lennie.' }),
});

type CreatePharmacyFormValues = z.infer<typeof formSchema>;

interface CreatePharmacyFormProps {
  onCreatePharmacy: (newPharmacy: Omit<Pharmacy, 'id'>) => void;
  onFormSubmit: () => void;
}

export default function CreatePharmacyForm({ onCreatePharmacy, onFormSubmit }: CreatePharmacyFormProps) {
  const { toast } = useToast();
  const form = useForm<CreatePharmacyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
    },
  });

  function onSubmit(values: CreatePharmacyFormValues) {
    onCreatePharmacy(values);
    toast({
      title: 'Gyógyszertár létrehozva',
      description: `Az új gyógyszertár sikeresen létrejött: ${values.name}.`,
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
              <FormLabel>Név</FormLabel>
              <FormControl>
                <Input placeholder="Gyógyszertár neve" {...field} />
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
              <FormLabel>Cím</FormLabel>
              <FormControl>
                <Input placeholder="Utca, házszám, város" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Gyógyszertár létrehozása</Button>
      </form>
    </Form>
  );
}
