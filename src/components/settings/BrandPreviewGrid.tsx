import { useState } from "react";
import { motion } from "framer-motion";
import { Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface BrandPreviewState {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  buttonStyle: string;
  defaultCtaText: string;
  tagline: string;
  organizationName?: string;
}

interface Props {
  state: BrandPreviewState;
}

function getBtnRadius(style: string) {
  return style === "pill" ? "9999px" : style === "square" ? "4px" : "8px";
}

function getFontFamily(font: string) {
  return font === "system" ? undefined : font;
}

/* ---------- Mockup primitives ---------- */

function EventCardMockup({ state, compact = false }: { state: BrandPreviewState; compact?: boolean }) {
  const btnRadius = getBtnRadius(state.buttonStyle);
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm" style={{ fontFamily: getFontFamily(state.fontFamily) }}>
      <div className={`${compact ? "h-24" : "h-32"} bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center relative`}>
        <span className="text-gray-400 text-xs">Afbeelding</span>
        <div
          className="absolute top-2 right-2 text-[9px] font-semibold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: state.secondaryColor }}
        >
          Live
        </div>
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="text-center rounded-md px-2 py-1" style={{ backgroundColor: state.primaryColor + "15" }}>
            <p className="text-[10px] font-bold leading-none" style={{ color: state.primaryColor }}>25 apr</p>
            <p className="text-[9px] text-gray-500 mt-0.5">20:00</p>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">Live muziek avond</p>
            <p className="text-xs text-gray-500 truncate">{state.organizationName || "Café de Haven"}</p>
          </div>
        </div>
        <button className="w-full text-center text-xs font-semibold text-white py-2" style={{ backgroundColor: state.primaryColor, borderRadius: btnRadius }}>
          {state.defaultCtaText}
        </button>
      </div>
    </div>
  );
}

function AgendaWidgetMockup({ state }: { state: BrandPreviewState }) {
  const btnRadius = getBtnRadius(state.buttonStyle);
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3" style={{ fontFamily: getFontFamily(state.fontFamily) }}>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
        {state.logoUrl ? (
          <img src={state.logoUrl} alt="" className="h-5 w-auto object-contain" />
        ) : (
          <div className="w-1 h-5 rounded-sm" style={{ backgroundColor: state.primaryColor }} />
        )}
        <p className="text-xs font-bold text-gray-900 truncate">Agenda · {state.organizationName || "Organisatie"}</p>
      </div>
      {[
        { day: "vr 25", time: "20:00", title: "Live muziek avond" },
        { day: "za 26", time: "14:00", title: "Wijnproeverij" },
        { day: "zo 27", time: "11:00", title: "Brunch & jazz" },
      ].map((ev, i) => (
        <div key={i} className="rounded-lg border border-gray-100 p-2 flex gap-2 items-center mb-1.5 last:mb-0">
          <div className="text-center rounded-md px-1.5 py-1 shrink-0" style={{ backgroundColor: state.primaryColor + "15" }}>
            <p className="text-[9px] font-semibold leading-none" style={{ color: state.primaryColor }}>{ev.day}</p>
            <p className="text-[9px] text-gray-500 mt-0.5">{ev.time}</p>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-gray-900 truncate">{ev.title}</p>
          </div>
          <div className="text-[9px] font-medium text-white px-2 py-0.5 shrink-0" style={{ backgroundColor: state.primaryColor, borderRadius: btnRadius }}>
            {state.defaultCtaText}
          </div>
        </div>
      ))}
    </div>
  );
}

function SingleEventWidgetMockup({ state }: { state: BrandPreviewState }) {
  const btnRadius = getBtnRadius(state.buttonStyle);
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3" style={{ fontFamily: getFontFamily(state.fontFamily) }}>
      <div className="h-28 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg mb-2 flex items-center justify-center relative overflow-hidden">
        <span className="text-gray-400 text-xs">Afbeelding</span>
        <div className="absolute inset-x-0 bottom-0 h-1.5" style={{ background: `linear-gradient(90deg, ${state.primaryColor}, ${state.secondaryColor})` }} />
      </div>
      <p className="text-sm font-bold text-gray-900">Live muziek avond</p>
      <p className="text-[11px] text-gray-500 mt-0.5">Vrijdag 25 april · 20:00</p>
      {state.tagline && <p className="text-[10px] italic text-gray-400 mt-1 line-clamp-2">{state.tagline}</p>}
      <button className="w-full text-center text-xs font-semibold text-white py-2 mt-2" style={{ backgroundColor: state.primaryColor, borderRadius: btnRadius }}>
        {state.defaultCtaText}
      </button>
    </div>
  );
}

function PublicPageMockup({ state, mobile = false }: { state: BrandPreviewState; mobile?: boolean }) {
  const btnRadius = getBtnRadius(state.buttonStyle);
  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${mobile ? "max-w-[200px] mx-auto" : ""}`} style={{ fontFamily: getFontFamily(state.fontFamily) }}>
      <div className={`${mobile ? "h-24" : "h-32"} bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center relative`}>
        <span className="text-gray-400 text-xs">Hero</span>
        {state.logoUrl && (
          <div className="absolute bottom-2 left-2">
            <img src={state.logoUrl} alt="" className="h-5 w-auto object-contain bg-white/90 rounded px-1 py-0.5" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: `linear-gradient(90deg, ${state.primaryColor}, ${state.secondaryColor})` }} />
      </div>
      <div className="p-3 space-y-2">
        <p className="text-sm font-bold text-gray-900">Live muziek avond</p>
        <p className="text-[10px] text-gray-500">Vrijdag 25 april · 20:00 · {state.organizationName || "Café de Haven"}</p>
        {state.tagline && <p className="text-[10px] italic text-gray-400 line-clamp-2">{state.tagline}</p>}
        <div className="flex gap-1.5">
          <button className="flex-1 text-center text-xs font-semibold text-white py-2" style={{ backgroundColor: state.primaryColor, borderRadius: btnRadius }}>
            {state.defaultCtaText}
          </button>
          <button className="text-xs font-semibold py-2 px-3 border" style={{ color: state.secondaryColor, borderColor: state.secondaryColor, borderRadius: btnRadius }}>
            Delen
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Grid wrapper ---------- */

function PreviewTile({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-secondary/20 border border-border p-3 space-y-2"
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      </div>
      {children}
    </motion.div>
  );
}

export default function BrandPreviewGrid({ state }: Props) {
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Preview overzicht</p>
          <p className="text-xs text-muted-foreground mt-0.5">Alle weergaves in één oogopslag — wijzigingen zijn direct zichtbaar.</p>
        </div>
        <div className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5">
          <Button
            size="sm"
            variant={viewport === "desktop" ? "secondary" : "ghost"}
            onClick={() => setViewport("desktop")}
            className="h-7 px-2.5 gap-1.5 text-xs"
          >
            <Monitor className="w-3.5 h-3.5" />Desktop
          </Button>
          <Button
            size="sm"
            variant={viewport === "mobile" ? "secondary" : "ghost"}
            onClick={() => setViewport("mobile")}
            className="h-7 px-2.5 gap-1.5 text-xs"
          >
            <Smartphone className="w-3.5 h-3.5" />Mobiel
          </Button>
        </div>
      </div>

      <div className={`grid gap-3 ${viewport === "mobile" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 md:grid-cols-2"}`}>
        <PreviewTile title="Event card">
          <div className={viewport === "mobile" ? "max-w-[220px] mx-auto" : ""}>
            <EventCardMockup state={state} compact={viewport === "mobile"} />
          </div>
        </PreviewTile>

        <PreviewTile title="Agenda widget">
          <div className={viewport === "mobile" ? "max-w-[220px] mx-auto" : ""}>
            <AgendaWidgetMockup state={state} />
          </div>
        </PreviewTile>

        <PreviewTile title="Single event widget">
          <div className={viewport === "mobile" ? "max-w-[220px] mx-auto" : ""}>
            <SingleEventWidgetMockup state={state} />
          </div>
        </PreviewTile>

        <PreviewTile title="Publieke event-pagina">
          <PublicPageMockup state={state} mobile={viewport === "mobile"} />
        </PreviewTile>
      </div>
    </div>
  );
}
