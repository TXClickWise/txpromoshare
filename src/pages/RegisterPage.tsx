import { Link } from "react-router-dom";
import { useState } from "react";
import { t } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSEO } from "@/lib/seo";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useSEO({
    title: "Gratis Account Aanmaken — Start met TX PromoShare",
    description: "Maak gratis een TX PromoShare account aan. Begin direct met het beheren en promoten van je evenementen. Geen creditcard nodig.",
    canonical: "/register",
  });

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-display font-bold">TX</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t.auth.register}</h1>
          <p className="text-sm text-muted-foreground mt-1">Start gratis met TX PromoShare</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <Label htmlFor="fullName">{t.auth.fullName}</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jan de Vries" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orgName">{t.auth.orgName}</Label>
            <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Café De Kroeg" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jan@voorbeeld.nl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t.auth.password}</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Link to="/app">
            <Button className="w-full gradient-hero text-primary-foreground border-0 hover:opacity-90 mt-2">
              Account aanmaken
            </Button>
          </Link>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t.auth.hasAccount}{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">{t.auth.login}</Link>
        </p>
      </div>
    </div>
  );
}
