import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MailX, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

export default function UnsubscribePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`, {
      headers: { apikey: anonKey },
    })
      .then(r => r.json())
      .then(data => {
        if (data.valid === false && data.reason === "already_unsubscribed") setStatus("already");
        else if (data.valid) setStatus("valid");
        else setStatus("invalid");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  async function handleUnsubscribe() {
    if (!token) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) setStatus("success");
      else if (data?.reason === "already_unsubscribed") setStatus("already");
      else setStatus("error");
    } catch {
      setStatus("error");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center"><Logo variant="light" size="md" /></div>

        {status === "loading" && (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Even geduld…</p>
          </>
        )}

        {status === "valid" && (
          <>
            <MailX className="w-12 h-12 text-muted-foreground mx-auto" />
            <h1 className="text-xl font-display font-bold text-foreground">Uitschrijven</h1>
            <p className="text-muted-foreground text-sm">
              Wil je geen e-mails meer ontvangen van TX EventShare?
            </p>
            <Button onClick={handleUnsubscribe} disabled={processing} className="gradient-hero text-primary-foreground border-0">
              {processing ? "Bezig…" : "Uitschrijven bevestigen"}
            </Button>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-12 h-12 text-accent mx-auto" />
            <h1 className="text-xl font-display font-bold text-foreground">Uitgeschreven</h1>
            <p className="text-muted-foreground text-sm">
              Je ontvangt geen e-mails meer van TX EventShare.
            </p>
          </>
        )}

        {status === "already" && (
          <>
            <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto" />
            <h1 className="text-xl font-display font-bold text-foreground">Al uitgeschreven</h1>
            <p className="text-muted-foreground text-sm">
              Je was al uitgeschreven van onze e-mails.
            </p>
          </>
        )}

        {(status === "invalid" || status === "error") && (
          <>
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <h1 className="text-xl font-display font-bold text-foreground">
              {status === "invalid" ? "Ongeldige link" : "Er ging iets mis"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {status === "invalid"
                ? "Deze uitschrijflink is ongeldig of verlopen."
                : "Probeer het later opnieuw of neem contact op via info@txeventshare.nl."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
