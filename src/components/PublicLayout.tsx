import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useUILanguage";
import { UILanguageSwitcher } from "@/components/i18n/UILanguageSwitcher";

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const navLinks = useMemo(() => [
    { to: "/", label: t("publicNav.home"), hash: false },
    { to: "/event-agenda-software", label: t("publicNav.benefits"), hash: false },
    { to: "/#hoe-het-werkt", label: t("publicNav.howItWorks"), hash: true },
    { to: "/#prijzen", label: t("publicNav.pricing"), hash: true },
    { to: "/demo", label: t("publicNav.demo"), hash: false },
  ], [t]);

  const featuredLink = { to: "/evenementen", label: t("publicNav.events") };


  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll to hash target when navigating to /#section from another route.
  // When navigating without a hash, scroll to top.
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const timer = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return () => clearTimeout(timer);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname, location.hash]);

  const handleHashClick = (e: React.MouseEvent, to: string) => {
    const [path, hash] = to.split("#");
    if (!hash) return;
    if (location.pathname === (path || "/")) {
      e.preventDefault();
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      setMenuOpen(false);
    } else {
      e.preventDefault();
      navigate(to);
      setMenuOpen(false);
    }
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    if (location.pathname === "/" && !location.hash) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      setMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className={cn(
        "sticky top-0 z-50 transition-all duration-200",
        scrolled ? "bg-background/90 backdrop-blur-md border-b border-border shadow-card" : "bg-transparent"
      )}>
        <div className="container flex items-center justify-between h-16 px-4">
          <Link to="/" onClick={handleHomeClick} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">TX</span>
            </div>
            <span className="font-display font-bold text-lg text-foreground">EventShare</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              link.hash ? (
                <a key={link.to} href={link.to} onClick={(e) => handleHashClick(e, link.to)} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {link.label}
                </a>
              ) : (
                <Link key={link.to} to={link.to} onClick={link.to === "/" ? handleHomeClick : undefined} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {link.label}
                </Link>
              )
            ))}
            <span className="h-5 w-px bg-border" aria-hidden />
            <Link
              to={featuredLink.to}
              className="relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-sm font-semibold text-primary hover:bg-primary/10 hover:border-primary/50 transition-colors animate-soft-glow"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" aria-hidden />
              {featuredLink.label}
            </Link>
            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t.auth.login}
            </Link>
            <Link to="/register" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-hero text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              Start gratis <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </nav>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-foreground">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-border px-4 py-4 space-y-3 bg-background">
            {navLinks.map((link) => (
              link.hash ? (
                <a key={link.to} href={link.to} onClick={(e) => handleHashClick(e, link.to)} className="block text-sm font-medium text-muted-foreground">{link.label}</a>
              ) : (
                <Link key={link.to} to={link.to} onClick={(e) => { if (link.to === "/") handleHomeClick(e); setMenuOpen(false); }} className="block text-sm font-medium text-muted-foreground">{link.label}</Link>
              )
            ))}
            <Link
              to={featuredLink.to}
              onClick={() => setMenuOpen(false)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-sm font-semibold text-primary"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" aria-hidden />
              {featuredLink.label}
            </Link>
            <Link to="/login" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-muted-foreground">{t.auth.login}</Link>
            <Link to="/register" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 rounded-lg gradient-hero text-primary-foreground text-sm font-semibold text-center">
              Start gratis
            </Link>
          </div>
        )}
      </header>
      <Outlet />
    </div>
  );
}
