import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { authApi } from "../api/authApi";
import { tokenStorage } from "./tokenStorage";
import type { User } from "./types";

interface AuthState {
  user: User | null;
  loading: boolean; // true while restoring a saved session
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  loginWithGoogle: (idToken: string, remember: boolean) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenStorage.get()) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => tokenStorage.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const res = await authApi.login(email, password);
    tokenStorage.set(res.token, remember);
    setUser(res.user);
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string, remember: boolean) => {
    const res = await authApi.google(idToken);
    tokenStorage.set(res.token, remember);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, loginWithGoogle, logout }),
    [user, loading, login, loginWithGoogle, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}