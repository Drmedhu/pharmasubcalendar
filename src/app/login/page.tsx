"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Briefcase } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { doc, setDoc } from 'firebase/firestore';


const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  name: z.string().min(2, { message: "Name is required."}),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string(),
  role: z.enum(['pharmacy', 'substitute'], { required_error: "You must select a role."}),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [authError, setAuthError] = useState<string | null>(null);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '', name: '', role: 'substitute' },
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleLogin = async (values: LoginFormValues) => {
    try {
      setAuthError(null);
      await signInWithEmailAndPassword(auth, values.email, values.password);
      // Let the useEffect handle the redirect
    } catch (error) {
      const authError = error as AuthError;
      setAuthError(authError.message);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: authError.code || "An unknown error occurred.",
      });
    }
  };

  const handleRegister = async (values: RegisterFormValues) => {
    try {
        setAuthError(null);
        if (!firestore) throw new Error("Firestore not available");
        
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const newUser = userCredential.user;

        // Ensure user profile is created immediately after registration
        if (newUser) {
            const userProfileRef = doc(firestore, 'userProfiles', newUser.uid);
            const profileData = {
                userId: newUser.uid,
                email: values.email,
                name: values.name,
                role: values.role
            };
            // Use await to ensure profile is created before any potential redirect or state change
            await setDoc(userProfileRef, profileData);
        }
        
        // The useEffect will handle the redirect once `useUser` is updated.
    } catch (error) {
        const authError = error as AuthError;
        setAuthError(authError.message);
        toast({
            variant: "destructive",
            title: "Registration Failed",
            description: authError.code || "An unknown error occurred.",
        });
    }
  };

  if (isUserLoading || user) {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center">
            <p>Loading...</p>
        </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className='w-full max-w-md'>
        <div className="flex justify-center items-center gap-3 mb-6">
            <Briefcase className="h-8 w-8 text-primary" />
            <h1 className="font-headline text-2xl font-bold text-foreground">
                PharmaSub Calendar
            </h1>
        </div>
        <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
            <Card>
                <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Enter your credentials to access your account.</CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                            <Input placeholder="email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    {authError && <p className="text-sm font-medium text-destructive">{authError}</p>}
                    <Button type="submit" className="w-full">Login</Button>
                    </form>
                </Form>
                </CardContent>
            </Card>
            </TabsContent>
            <TabsContent value="register">
            <Card>
                <CardHeader>
                <CardTitle>Create an Account</CardTitle>
                <CardDescription>Sign up to start booking or posting shifts.</CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                     <FormField
                        control={registerForm.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                            <FormLabel>I am a...</FormLabel>
                            <FormControl>
                                <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex space-x-4"
                                >
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
                    <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full Name / Pharmacy Name</FormLabel>
                            <FormControl>
                            <Input placeholder="John Doe or City Pharmacy" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                            <Input placeholder="email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     {authError && <p className="text-sm font-medium text-destructive">{authError}</p>}
                    <Button type="submit" className="w-full">Register</Button>
                    </form>
                </Form>
                </CardContent>
            </Card>
            </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
