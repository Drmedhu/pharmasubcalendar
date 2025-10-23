"use client";

// For now, we will use a hardcoded admin UID.
// In a production app, this should be managed via a database role or a custom claim.
// TODO: Replace this with your actual Firebase User ID for the admin user.
export const ADMIN_UID = "REPLACE_WITH_YOUR_ADMIN_FIREBASE_UID";

export const isAdmin = (uid: string | undefined): boolean => {
    return uid === ADMIN_UID;
}
