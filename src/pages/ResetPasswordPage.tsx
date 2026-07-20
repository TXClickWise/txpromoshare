import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { toast.error("Vul je e-mailadres in."); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setLoading(false);
    if (error) {
      toast.error("Er ging iets mis: " + error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4"><Logo variant="light" size="md" /></div>
          <h1 className="text-2xl font-display font-bold text-foreground">Wachtwoord vergeten</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sent ? "Check je inbox voor een reset link." : "Voer je e-mailadres in om je wachtwoord te herstellen."}
          </p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <div className="rounded-xl bg-accent/10 border border-accent/20 p-6">
              <p className="text-sm text-foreground font-medium mb-1">📧 E-mail verstuurd!</p>
              <p className="text-xs text-muted-foreground">
                Als er een account bestaat voor <strong>{email}</strong>, ontvang je een e-mail met een link om je wachtwoord te herstellen.
              </p>
            </div>
            <Link to="/login" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              <ArrowLeft className="w-4 h-4" />Terug naar inloggen
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jan@voorbeeld.nl" required />
            </div>
            <Button type="submit" disabled={loading} className="w-full gradient-hero text-primary-foreground border-0 hover:opacity-90">
              {loading ? "Bezig..." : "Verstuur reset link"}
            </Button>
            <p className="text-center">
              <Link to="/login" className="text-sm text-primary hover:underline">Terug naar inloggen</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
