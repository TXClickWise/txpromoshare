import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useUILanguage";
import { UILanguageSwitcher } from "@/components/i18n/UILanguageSwitcher";
import { Logo } from "@/components/brand/Logo";

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const navLinks = useMemo(() => [
    { to: "/#hoe-het-werkt", label: t("publicNav.howItWorks"), hash: true },
    { to: "/prijzen", label: t("publicNav.pricing"), hash: false },
    { to: "/evenementen", label: t("publicNav.events"), hash: false },
    { to: "/demo", label: t("publicNav.demo"), hash: false },
  ], [t]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const handleLogoClick = (e: React.MouseEvent) => {
    if (location.pathname === "/" && !location.hash) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className={cn(
        "sticky top-0 z-50 transition-all duration-200",
        scrolled ? "bg-background/90 backdrop-blur-md border-b border-border shadow-card" : "bg-transparent"
      )}>
        <div className="container flex items-center justify-between h-16 md:h-[4.5rem] px-4">
          <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2">
            <Logo variant="light" size="md" />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              link.hash ? (
                <a key={link.to} href={link.to} onClick={(e) => handleHashClick(e, link.to)} className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
                  {link.label}
                </a>
              ) : (
                <Link key={link.to} to={link.to} className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
                  {link.label}
                </Link>
              )
            ))}
            <span className="h-5 w-px bg-border" aria-hidden />
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 rounded-lg border border-primary text-primary text-sm font-semibold hover:bg-primary/5 transition-colors"
            >
              {t("publicNav.login")}
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              {t("publicNav.startFree")} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <UILanguageSwitcher variant="compact" />
          </nav>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Sluit menu" : "Open menu"}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 text-foreground"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <nav className="px-4 py-2 flex flex-col">
              {navLinks.map((link) => (
                link.hash ? (
                  <a
                    key={link.to}
                    href={link.to}
                    onClick={(e) => handleHashClick(e, link.to)}
                    className="flex items-center min-h-[44px] py-3 text-base font-medium text-foreground"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center min-h-[44px] py-3 text-base font-medium text-foreground"
                  >
                    {link.label}
                  </Link>
                )
              ))}
            </nav>
            <div className="border-t border-border px-4 py-4 space-y-3">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center w-full min-h-[44px] px-4 py-3 rounded-lg border border-primary text-primary text-base font-semibold"
              >
                {t("publicNav.login")}
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-3 rounded-lg bg-primary text-primary-foreground text-base font-semibold"
              >
                {t("publicNav.startFree")} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="border-t border-border px-4 py-4">
              <UILanguageSwitcher variant="compact" />
            </div>
          </div>
        )}
      </header>
      <Outlet />
    </div>
  );
}