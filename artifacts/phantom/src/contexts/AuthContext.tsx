import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { getSession, clearSession, type PhantomUser } from "@/lib/auth";

interface AuthContextValue {
  isAuthorized: boolean;
  user: PhantomUser | null;
  authorize: (user: PhantomUser) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PhantomUser | null>(() => getSession());

  const authorize = useCallback((u: PhantomUser) => setUser(u), []);

  const signOut = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthorized: !!user, user, authorize, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
