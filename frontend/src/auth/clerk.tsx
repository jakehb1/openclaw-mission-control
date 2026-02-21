"use client";

// AUTH DISABLED - Personal use only
// All users are always "signed in"

import type { ReactNode, ComponentProps } from "react";

import { ClerkProvider } from "@clerk/nextjs";

export function isClerkEnabled(): boolean {
  return false;
}

// Always render children (user is always "signed in")
export function SignedIn(props: { children: ReactNode }) {
  return <>{props.children}</>;
}

// Never render (user is never "signed out")
export function SignedOut(props: { children: ReactNode }) {
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function SignInButton(props: any) {
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function SignOutButton(props: any) {
  return null;
}

export function useUser(): { isLoaded: boolean; isSignedIn: boolean; user: any } {
  return {
    isLoaded: true,
    isSignedIn: true,
    user: { 
      firstName: "Jakeh", 
      lastName: "", 
      fullName: "Jakeh", 
      username: "jakeh", 
      emailAddresses: [{ emailAddress: "jakehbradley@me.com" }], 
      primaryEmailAddress: { emailAddress: "jakehbradley@me.com" } 
    },
  };
}

export function useAuth() {
  return {
    isLoaded: true,
    isSignedIn: true,
    userId: "jakeh",
    sessionId: "local-session",
    getToken: async () => "local-token",
  } as const;
}

export { ClerkProvider };
