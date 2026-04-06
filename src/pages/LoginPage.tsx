import { Link } from "react-router-dom";
import { useState } from "react";
import { t } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSEO } from "@/lib/seo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useSEO({
    title: "Inloggen — TX PromoShare",
    description: "Log in op je TX PromoShare account. Beheer je evenementen, widgets en distributie vanuit één dashboard.",
    canonical: "/login",
    noindex: true,
  });

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-display font-bold">TX</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t.auth.login}</h1>
          <p className="text-sm text-muted-foreground mt-1">Welkom terug bij TX PromoShare</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jan@voorbeeld.nl" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t.auth.password}</Label>
              <Link to="#" className="text-xs text-primary hover:underline">{t.auth.forgotPassword}</Link>
            </div>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Link to="/app">
            <Button className="w-full gradient-hero text-primary-foreground border-0 hover:opacity-90 mt-2">
              {t.auth.login}
            </Button>
          </Link>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t.auth.noAccount}{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">{t.auth.register}</Link>
        </p>
      </div>
    </div>
  );
}
