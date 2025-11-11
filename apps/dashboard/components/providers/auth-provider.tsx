'use client';

import { createContext, useContext, useMemo, useState } from "react";

import type { AuthPayload, AuthSession, AuthUser } from "@/lib/auth";

type AuthContextValue = {
  user: AuthUser | null;
  session: AuthSession | null;
  setAuth: (payload: AuthPayload | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  initialAuth: AuthPayload | null;
  children: React.ReactNode;
};

export function AuthProvider({ initialAuth, children }: AuthProviderProps) {
  const [auth, setAuthState] = useState<AuthPayload | null>(initialAuth);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: auth?.user ?? null,
      session: auth?.session ?? null,
      setAuth: setAuthState
    }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth mora biti pozvan unutar AuthProvider komponentе.");
  }

  return context;
};


