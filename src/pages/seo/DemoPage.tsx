import { Link } from "react-router-dom";
import { ArrowRight, Send, Mail, Phone, MapPin, Loader2 } from "lucide-react";
import { useSEO, breadcrumbSchema } from "@/lib/seo";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DEMO_EVENT_NAME = "form_submitted_demo";

declare global {
  interface Window {
    LeadConnector?: { track?: (eventName: string, data?: Record<string, unknown>) => void };
    leadConnector?: { track?: (eventName: string, data?: Record<string, unknown>) => void };
  }
}

function fireClickWiseExternalEvent(payload: Record<string, unknown>) {
  try {
    const lc = window.LeadConnector ?? window.leadConnector;
    if (lc && typeof lc.track === "function") {
      lc.track(DEMO_EVENT_NAME, payload);
    }
  } catch (err) {
    console.warn("[ClickWise] external event call failed", err);
  }
}

const initialForm = {
  name: "",
  email: "",
  company: "",
  org_type: "",
  phone: "",
  message: "",
  website: "", // honeypot
};

export default function DemoPage() {
  useSEO({
    title: "Gratis Demo Aanvragen — Zie TX EventShare in Actie",
    description: "Plan een vrijblijvende demo en ontdek hoe TX EventShare je event promotie vereenvoudigt. Agenda software, widgets, distributie en ClickWise integratie — in één platform.",
    canonical: "/demo",
    jsonLd: [
      breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Demo aanvragen", url: "/demo" },
      ]),
    ],
  });

  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const update = (k: keyof typeof initialForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Vul je naam en e-mailadres in.");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-demo-form", {
        body: {
          ...form,
          source_url: typeof window !== "undefined" ? window.location.href : "",
        },
      });
      if (error) throw error;
      if (data && (data as any).error) throw new Error((data as any).error);

      // Trigger ClickWise External Event (client-side, per ClickWise instructions)
      fireClickWiseExternalEvent({
        email: form.email,
        name: form.name,
        phone: form.phone,
        company: form.company,
        org_type: form.org_type,
        message: form.message,
        source: "txeventshare.nl/demo",
      });

      toast.success("Bedankt! We nemen binnen 24 uur contact met je op.");
      setForm(initialForm);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Er ging iets mis. Probeer het later opnieuw.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="py-16 md:py-24">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <nav aria-label="breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground">Home</Link></li>
              <li>/</li>
              <li className="text-foreground font-medium">Demo aanvragen</li>
            </ol>
          </nav>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Ontdek TX EventShare in een persoonlijke demo
              </h1>
              <p className="text-muted-foreground mb-8">
                Wil je zien hoe TX EventShare werkt voor jouw bedrijf? Plan een vrijblijvende demo en ontdek hoe je evenementen sneller en professioneler kunt promoten.
              </p>

              <div className="space-y-6 mb-8">
                <h2 className="text-lg font-display font-bold text-foreground">Wat je leert in de demo</h2>
                <ul className="space-y-3">
                  {[
                    "Hoe je in minuten een event aanmaakt en publiceert",
                    "Hoe de embedded agenda widget werkt op je website",
                    "Hoe je events verspreidt via WhatsApp en social media",
                    "Hoe de ClickWise integratie je marketing versterkt",
                    "Welk plan het beste past bij jouw organisatie",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                      <Send className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> info@txeventshare.nl</div>
                <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> +31 (0)222 123 456</div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Texel, Nederland</div>
              </div>
            </div>

            <div className="p-6 md:p-8 rounded-2xl bg-card border border-border shadow-card">
              <h2 className="text-xl font-display font-bold text-foreground mb-6">Plan je demo</h2>
              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">Naam</label>
                  <input id="name" type="text" required value={form.name} onChange={update("name")} placeholder="Je volledige naam" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">E-mailadres</label>
                  <input id="email" type="email" required value={form.email} onChange={update("email")} placeholder="naam@bedrijf.nl" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-foreground mb-1">Bedrijfsnaam</label>
                  <input id="company" type="text" value={form.company} onChange={update("company")} placeholder="Je bedrijf of organisatie" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">Telefoon (optioneel)</label>
                  <input id="phone" type="tel" value={form.phone} onChange={update("phone")} placeholder="+31 6 ..." className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-foreground mb-1">Type organisatie</label>
                  <select id="type" value={form.org_type} onChange={update("org_type")} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="">Selecteer...</option>
                    <option value="cafe">Café / Bar</option>
                    <option value="restaurant">Restaurant / Beach club</option>
                    <option value="podium">Poppodium / Muzieklocatie</option>
                    <option value="event">Eventorganisatie</option>
                    <option value="festival">Festivalorganisatie</option>
                    <option value="other">Anders</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1">Bericht (optioneel)</label>
                  <textarea id="message" rows={3} value={form.message} onChange={update("message")} placeholder="Vertel kort wat je zoekt..." className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                {/* Honeypot — hidden from users */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input id="website" type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={update("website")} />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg gradient-hero text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Versturen…</>) : (<>Demo aanvragen <ArrowRight className="w-4 h-4" /></>)}
                </button>
                <p className="text-xs text-muted-foreground text-center">Vrijblijvend • Reactie binnen 24 uur</p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
