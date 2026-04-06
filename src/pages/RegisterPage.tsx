import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { t } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useSEO({
    title: "Gratis Account Aanmaken — Start met TX EventShare",
    description: "Maak gratis een TX EventShare account aan. Begin direct met het beheren en promoten van je evenementen. Geen creditcard nodig.",
    canonical: "/register",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast.error("Vul alle verplichte velden in.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, org_name: orgName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account aangemaakt! Je wordt ingelogd...");
      navigate("/app");
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-display font-bold">TX</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t.auth.register}</h1>
          <p className="text-sm text-muted-foreground mt-1">Start gratis met TX EventShare</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="fullName">{t.auth.fullName}</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jan de Vries" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orgName">{t.auth.orgName}</Label>
            <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Café De Kroeg" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jan@voorbeeld.nl" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t.auth.password}</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
          </div>
          <Button type="submit" disabled={loading} className="w-full gradient-hero text-primary-foreground border-0 hover:opacity-90 mt-2">
            {loading ? "Bezig..." : "Account aanmaken"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t.auth.hasAccount}{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">{t.auth.login}</Link>
        </p>
      </div>
    </div>
  );
}
