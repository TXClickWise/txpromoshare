import { Outlet, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">TX</span>
            </div>
            <span className="font-display font-bold text-lg text-foreground">PromoShare</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Prijzen
            </Link>
            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t.auth.login}
            </Link>
            <Link to="/register" className="px-4 py-2 rounded-lg gradient-hero text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              {t.landing.hero.cta}
            </Link>
          </nav>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-foreground">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-border px-4 py-4 space-y-3 bg-background">
            <Link to="/pricing" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-muted-foreground">Prijzen</Link>
            <Link to="/login" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-muted-foreground">{t.auth.login}</Link>
            <Link to="/register" onClick={() => setMenuOpen(false)} className="block px-4 py-2 rounded-lg gradient-hero text-primary-foreground text-sm font-semibold text-center">
              {t.landing.hero.cta}
            </Link>
          </div>
        )}
      </header>
      <Outlet />
    </div>
  );
}
