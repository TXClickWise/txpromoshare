import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const navLinks = [
  { to: "/", label: "Home", hash: false },
  { to: "/evenementen", label: "Evenementen", hash: false },
  { to: "/event-agenda-software", label: "Features", hash: false },
  { to: "/#hoe-het-werkt", label: "Hoe het werkt", hash: true },
  { to: "/pricing", label: "Prijzen", hash: false },
  { to: "/demo", label: "Demo", hash: false },
];

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll to hash target when navigating to /#section from another route
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      // Wait for the target route to render
      const timer = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return () => clearTimeout(timer);
    }
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

  return (
    <div className="min-h-screen bg-background">
      <header className={cn(
        "sticky top-0 z-50 transition-all duration-200",
        scrolled ? "bg-background/90 backdrop-blur-md border-b border-border shadow-card" : "bg-transparent"
      )}>
        <div className="container flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
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
                <Link key={link.to} to={link.to} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {link.label}
                </Link>
              )
            ))}
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
                <a key={link.to} href={link.to} onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-muted-foreground">{link.label}</a>
              ) : (
                <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-muted-foreground">{link.label}</Link>
              )
            ))}
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
