"use client";
import type { User } from "firebase/auth";

// The email of the admin user.
export const ADMIN_EMAIL = "erno.santha@drmed.hu";

export const isAdmin = (user: User | null | undefined): boolean => {
    return user?.email === ADMIN_EMAIL;
}
