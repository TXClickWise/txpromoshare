import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Tables } from "@/integrations/supabase/types";

interface TenantContextValue {
  tenant: Tables<"tenants"> | null;
  tenantId: string | null;
  role: string | null;
  loading: boolean;
  refetch: () => void;
}

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  tenantId: null,
  role: null,
  loading: true,
  refetch: () => {},
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tables<"tenants"> | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchTenant() {
    if (!user) {
      setTenant(null);
      setRole(null);
      setLoading(false);
      return;
    }

    // Get user's first tenant role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("tenant_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (roleData) {
      setRole(roleData.role);
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", roleData.tenant_id)
        .maybeSingle();
      setTenant(tenantData);
    } else {
      setTenant(null);
      setRole(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchTenant();
  }, [user]);

  return (
    <TenantContext.Provider value={{ tenant, tenantId: tenant?.id ?? null, role, loading, refetch: fetchTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
