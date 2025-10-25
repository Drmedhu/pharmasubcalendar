"use client";
import type { UserProfile } from "@/lib/types";

// The email of the admin user.
export const ADMIN_EMAIL = "erno.santha@drmed.hu";

export const isAdmin = (userProfile: UserProfile | null | undefined): boolean => {
    if (!userProfile) return false;
    return userProfile.role === 'admin' || userProfile.email === ADMIN_EMAIL;
}
