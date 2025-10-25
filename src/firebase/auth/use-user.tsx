'use client';

import { useState, useEffect } from 'react';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { useAuth as useFirebaseAuth } from '@/firebase/provider'; // Alias to avoid name clash

export interface UserAuthHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserAuthHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserAuthHookResult => {
  const auth = useFirebaseAuth(); // Use the aliased import
  const [userState, setUserState] = useState<UserAuthHookResult>({
    user: auth.currentUser,
    isUserLoading: auth.currentUser === null, // Initially loading if no user
    userError: null,
  });

  useEffect(() => {
    // If auth is not ready, do nothing.
    if (!auth) {
      setUserState({ user: null, isUserLoading: false, userError: new Error("Firebase Auth is not initialized.") });
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUserState({ user, isUserLoading: false, userError: null });
      },
      (error) => {
        console.error("useUser hook onAuthStateChanged error:", error);
        setUserState({ user: null, isUserLoading: false, userError: error });
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]); // Rerun effect if auth instance changes

  return userState;
};

/**
 * A convenience hook to get the Auth instance.
 * @returns {Auth} The Firebase Auth instance.
 */
export const useAuth = (): Auth => {
    return useFirebaseAuth();
};
