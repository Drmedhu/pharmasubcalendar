'use client';

import React, { useMemo, type ReactNode, useState, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';


interface FirebaseServices {
    firebaseApp: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
}

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseServices, setFirebaseServices] = useState<FirebaseServices | null>(null);

  useEffect(() => {
    // This effect runs once on the client after the component mounts.
    // It initializes Firebase and sets the services in state.
    // This avoids race conditions and ensures Firebase is ready before it's used.
    if (typeof window !== 'undefined') {
        const services = initializeFirebase();
        setFirebaseServices(services);
    }
  }, []);

  // While services are being initialized, we can show a loader
  if (!firebaseServices) {
      return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center">
            <p>Initializing Firebase...</p>
        </div>
      );
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
