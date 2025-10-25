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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { UserProfile } from '@/lib/types';
import { ADMIN_EMAIL } from '@/lib/admin';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  role: z.enum(['pharmacy', 'substitute', 'admin'], {
    required_error: "You need to select a role.",
  }),
});

type ProfileFormValues = z.infer<typeof formSchema>;

interface ProfileFormProps {
  userProfile: UserProfile | null;
  onSave: (data: ProfileFormValues) => void;
  onFormSubmit: () => void;
}

export default function ProfileForm({ userProfile, onSave, onFormSubmit }: ProfileFormProps) {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    values: {
      name: userProfile?.name || '',
      email: userProfile?.email || '',
      role: userProfile?.role || 'substitute',
    },
  });

  const isAdminUser = userProfile?.email === ADMIN_EMAIL;

  function onSubmit(values: ProfileFormValues) {
    onSave(values);
    onFormSubmit();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name / Pharmacy Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
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
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input placeholder="john.doe@example.com" {...field} readOnly disabled />
              </FormControl>
               <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>My Role is...</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-4"
                  disabled={!!userProfile && !isAdminUser} // Can't change role after registration, unless admin
                >
                  {isAdminUser && (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                        <RadioGroupItem value="admin" />
                        </FormControl>
                        <FormLabel className="font-normal">Admin</FormLabel>
                    </FormItem>
                  )}
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="pharmacy" />
                    </FormControl>
                    <FormLabel className="font-normal">Pharmacy</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="substitute" />
                    </FormControl>
                    <FormLabel className="font-normal">Substitute</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Save Profile</Button>
      </form>
    </Form>
  );
}
