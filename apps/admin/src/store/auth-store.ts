import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";
import type { AdminProfile } from "@/types/admin";

export type AuthStatus =
  | "booting"
  | "authenticated"
  | "unauthenticated"
  | "forbidden";

interface AuthStore {
  status: AuthStatus;
  session: Session | null;
  accessToken: string | null;
  profile: AdminProfile | null;
  setSession: (session: Session | null) => void;
  setProfile: (profile: AdminProfile | null) => void;
  setForbidden: () => void;
  markBooting: () => void;
  clearAuth: () => void;
  isAdmin: () => boolean;
}

function profileIsAdmin(profile: AdminProfile | null): boolean {
  if (!profile) {
    return false;
  }

  return (
    profile.role === "ADMIN" ||
    profile.isAdmin === true ||
    profile.is_admin === true
  );
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  status: "booting",
  session: null,
  accessToken: null,
  profile: null,

  setSession: (session) => {
    set({
      session,
      accessToken: session?.access_token ?? null,
      status: session ? "authenticated" : "unauthenticated",
      profile: session ? get().profile : null,
    });
  },

  setProfile: (profile) => {
    set({
      profile,
      status: profile ? "authenticated" : get().status,
    });
  },

  setForbidden: () => {
    set({
      status: "forbidden",
      profile: null,
    });
  },

  markBooting: () => {
    set({ status: "booting" });
  },

  clearAuth: () => {
    set({
      status: "unauthenticated",
      session: null,
      accessToken: null,
      profile: null,
    });
  },

  isAdmin: () => profileIsAdmin(get().profile),
}));

export function isAdminProfile(profile: AdminProfile | null): boolean {
  return profileIsAdmin(profile);
}
