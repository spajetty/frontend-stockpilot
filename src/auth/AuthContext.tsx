import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { authApi } from "../api/authApi";
import SignOutOverlay from "../components/SignOutOverlay";
import { tokenStorage } from "./tokenStorage";
import type { User } from "./types";

const MIN_SIGNOUT_MS = 3000; 

interface AuthState {
  user: User | null;
  loading: boolean; 
  signingOut: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  loginWithGoogle: (idToken: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const signingOutRef = useRef(false); 

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

  const logout = useCallback(async () => {
    if (signingOutRef.current) return;
    signingOutRef.current = true;
    setSigningOut(true);

    await new Promise((resolve) => setTimeout(resolve, MIN_SIGNOUT_MS));

    tokenStorage.clear();
    setUser(null);
    setSigningOut(false);
    signingOutRef.current = false;
  }, []);

  const value = useMemo(
    () => ({ user, loading, signingOut, login, loginWithGoogle, logout }),
    [user, loading, signingOut, login, loginWithGoogle, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {signingOut && <SignOutOverlay />}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}