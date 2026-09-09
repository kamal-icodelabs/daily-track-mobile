"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { ROLE_PERMISSIONS, type Permissions, type Role } from "@/lib/data/types";

export function useCan(): Permissions {
  const { user } = useAuth();
  return useMemo(() => {
    const role: Role = user?.role ?? "employee";
    return ROLE_PERMISSIONS[role];
  }, [user]);
}

export function useRole(): Role {
  const { user } = useAuth();
  return user?.role ?? "employee";
}

export function useIsAdmin(): boolean {
  const role = useRole();
  return role === "admin";
}
