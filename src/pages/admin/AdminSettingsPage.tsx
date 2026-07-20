import { useState } from "react";
import { Key, Save, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ApiKeyField {
  name: string;
  label: string;
  description: string;
  secretName: string;
  placeholder: string;
}

const API_KEYS: ApiKeyField[] = [
  {
    name: "unsplash",
    label: "Unsplash Access Key",
    description: "Voor het zoeken van stockfoto's via Unsplash. Verkrijgbaar op unsplash.com/developers",
    secretName: "UNSPLASH_ACCESS_KEY",
    placeholder: "Vul je Unsplash Access Key in...",
  },
  {
    name: "pexels",
    label: "Pexels API Key",
    description: "Voor het zoeken van stockfoto's via Pexels. Verkrijgbaar op pexels.com/api",
    secretName: "PEXELS_API_KEY",
    placeholder: "Vul je Pexels API Key in...",
  },
];

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});

  async function handleTestKey(field: ApiKeyField) {
    setTesting((p) => ({ ...p, [field.name]: true }));
    try {
      const { data, error } = await supabase.functions.invoke("search-stock-images", {
        body: { query: "test", page: 1, perPage: 2 },
      });
      if (error) throw error;
      const results = data?.results || [];
      const hasSource = results.some((r: any) =>
        field.name === "unsplash" ? r.source === "unsplash" : r.source === "pexels"
      );
      if (hasSource) {
        toast.success(`${field.label} werkt correct!`);
      } else {
        toast.warning(`${field.label}: geen resultaten gevonden. Mogelijk is de key ongeldig.`);
      }
    } catch {
      toast.error(`Test mislukt voor ${field.label}`);
    } finally {
      setTesting((p) => ({ ...p, [field.name]: false }));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Platform Instellingen</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Beheer API-sleutels en platform-configuratie</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API-sleutels
          </CardTitle>
          <CardDescription>
            Configureer externe API-sleutels. Wijzigingen worden doorgevoerd via Lovable Cloud → Secrets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {API_KEYS.map((field) => (
            <div key={field.name} className="space-y-2 p-4 rounded-lg border border-border bg-secondary/30">
              <Label className="font-medium">{field.label}</Label>
              <p className="text-xs text-muted-foreground">{field.description}</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={visible[field.name] ? "text" : "password"}
                    placeholder={field.placeholder}
                    value={values[field.name] || ""}
                    onChange={(e) => setValues((p) => ({ ...p, [field.name]: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setVisible((p) => ({ ...p, [field.name]: !p[field.name] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {visible[field.name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestKey(field)}
                  disabled={testing[field.name]}
                  className="gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing[field.name] ? "animate-spin" : ""}`} />
                  Test
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Secret naam: <code className="bg-muted px-1 rounded">{field.secretName}</code> — 
                wijzig via Lovable Cloud → Secrets
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
