import { createContext, useContext, useState } from "react";
import { setAuthToken } from "@/lib/api";

export type Session = {
  token: string;
  user: {
    id: string;
    email: string;
    role: "user" | "admin";
    status: "active" | "pending" | "disabled";
  };
};

type AuthContextType = {
  session: Session | null;
  setSession: (session: Session | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(() => {
    const stored = localStorage.getItem("session");
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored) as Session;
      if (parsed?.token) setAuthToken(parsed.token);
      return parsed;
    } catch {
      localStorage.removeItem("session");
      return null;
    }
  });

  const setSession = (next: Session | null) => {
    setSessionState(next);
    if (next) {
      localStorage.setItem("session", JSON.stringify(next));
      setAuthToken(next.token);
    } else {
      localStorage.removeItem("session");
      setAuthToken(null);
    }
  };

  const logout = () => setSession(null);

  return <AuthContext.Provider value={{ session, setSession, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
