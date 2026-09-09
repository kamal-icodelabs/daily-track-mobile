"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { USERS, findUserByEmail } from "@/lib/data/mock";
import type { Role, User } from "@/lib/data/types";

const SESSION_KEY = "dailytask-session";

interface AuthContextValue {
  user: User | null;
  login: (email: string) => User | null;
  logout: () => void;
  users: User[];
  assignRole: (userId: string, role: Role) => void;
  setTester: (userId: string, isTester: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(USERS);
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const id = window.localStorage.getItem(SESSION_KEY);
      if (id) return USERS.find((u) => u.id === id) ?? null;
    } catch {
      // ignore
    }
    return null;
  });

  const login = useCallback(
    (email: string): User | null => {
      const found = findUserByEmail(email);
      if (!found) return null;
      const fresh = users.find((u) => u.id === found.id) ?? found;
      setUser(fresh);
      try {
        window.localStorage.setItem(SESSION_KEY, fresh.id);
      } catch {
        // ignore
      }
      return fresh;
    },
    [users]
  );

  const logout = useCallback(() => {
    setUser(null);
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
  }, []);

  const assignRole = useCallback((userId: string, role: Role) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role } : u))
    );
  }, []);

  const setTester = useCallback((userId: string, isTester: boolean) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId && u.role === "employee" ? { ...u, isTester } : u
      )
    );
  }, []);

  const value = useMemo(
    () => ({ user, login, logout, users, assignRole, setTester }),
    [user, login, logout, users, assignRole, setTester]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
