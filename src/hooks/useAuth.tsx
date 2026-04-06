import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isPlatformAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isPlatformAdmin: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        checkPlatformAdmin(session.user.id);
      } else {
        setIsPlatformAdmin(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        checkPlatformAdmin(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkPlatformAdmin(userId: string) {
    const { data } = await supabase.rpc("is_platform_admin", { _user_id: userId });
    setIsPlatformAdmin(!!data);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setIsPlatformAdmin(false);
  }

  return (
    <AuthContext.Provider value={{ user, loading, isPlatformAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
