import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "@/hooks/useUILanguage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoTxEventShare from "@/assets/logo-tx-eventshare.png";

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useSEO({
    title: t("auth.loginTitleSeo"),
    description: t("auth.loginDescSeo"),
    canonical: "/login",
    noindex: true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t("auth.fillEmailPassword"));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(`${t("auth.loginFailed")}: ${error.message}`);
    } else {
      toast.success(t("auth.loginSuccess"));
      navigate("/app");
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={logoTxEventShare} alt="TX EventShare" className="h-12 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-foreground">{t("auth.login")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("auth.welcomeBack")}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("auth.emailPlaceholder")} required />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Link to="/reset-password" className="text-xs text-primary hover:underline">{t("auth.forgotPassword")}</Link>
            </div>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" disabled={loading} className="w-full gradient-hero text-primary-foreground border-0 hover:opacity-90 mt-2">
            {loading ? t("auth.busy") : t("auth.login")}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t("auth.noAccount")}{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">{t("auth.register")}</Link>
        </p>
      </div>
    </div>
  );
}
