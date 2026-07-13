"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch, getToken, setToken } from "@/lib/api";

interface AuthUser {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface AuthResponse extends AuthUser {
  token: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  loginWithGoogleIdToken: (idToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_STORAGE_KEY = "maxi_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hidratación única desde localStorage: el prerender estático no puede leer
    // window, así que el estado real recién se conoce acá.
    const token = getToken();
    const storedUser = window.localStorage.getItem(USER_STORAGE_KEY);
    /* eslint-disable react-hooks/set-state-in-effect */
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const loginWithGoogleIdToken = useCallback(async (idToken: string) => {
    const response = await apiFetch<AuthResponse>("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });
    setToken(response.token);
    const authUser: AuthUser = {
      email: response.email,
      displayName: response.displayName,
      avatarUrl: response.avatarUrl,
    };
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));
    setUser(authUser);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    window.localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, loginWithGoogleIdToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
