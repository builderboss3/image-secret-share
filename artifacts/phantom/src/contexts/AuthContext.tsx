import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { getToken, clearToken } from "@/lib/auth";

interface AuthContextValue {
  isAuthorized: boolean;
  authorize: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(() => !!getToken());

  const authorize = useCallback(() => setIsAuthorized(true), []);

  const signOut = useCallback(() => {
    clearToken();
    setIsAuthorized(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthorized, authorize, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
