import { Link, useNavigate } from "react-router-dom";
import { Layers, ArrowRight, Sparkles, Plus, MoreVertical, Trash2, Copy, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/EmptyState";

interface TemplateData {
  id: string;
  name: string;
  is_system: boolean;
  category_id: string | null;
  prefill_data: Record<string, any>;
  page_layout: Record<string, any>;
  sort_order: number;
  tenant_id: string | null;
  created_at: string;
}

const CATEGORY_EMOJI: Record<string, string> = {
  sport: "⚽",
  proeverij: "🍷",
  "live-muziek": "🎵",
  "thema-avond": "🎭",
  overig: "✨",
};

export default function TemplatesPage() {
  const { tenantId } = useTenant();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch system templates + tenant custom templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["event-templates", tenantId],
    queryFn: async () => {
      const { data } = await supabase
        .from("event_templates")
        .select("*, categories(slug, name)")
        .or(`is_system.eq.true,tenant_id.eq.${tenantId}`)
        .order("sort_order");
      return (data || []) as (TemplateData & { categories?: { slug: string; name: string } | null })[];
    },
    enabled: !!tenantId,
  });

  // Fetch recent events for "save as template"
  const { data: recentEvents = [] } = useQuery({
    queryKey: ["recent-events-for-template", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data } = await supabase
        .from("events")
        .select("id, title, category_id, short_description, start_time, end_time, cta_button_text, organizer_name")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!tenantId,
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("event_templates").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-templates"] });
      toast.success("Sjabloon verwijderd");
    },
  });

  const saveEventAsTemplate = useMutation({
    mutationFn: async (event: typeof recentEvents[0]) => {
      await supabase.from("event_templates").insert({
        name: `${event.title} (sjabloon)`,
        tenant_id: tenantId!,
        is_system: false,
        category_id: event.category_id,
        prefill_data: {
          shortDescription: event.short_description || "",
          startTime: event.start_time || "20:00",
          endTime: event.end_time || "23:00",
          ctaButtonText: event.cta_button_text || "Reserveer nu",
          organizer: event.organizer_name || "",
        },
        page_layout: {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-templates"] });
      toast.success("Event opgeslagen als sjabloon");
    },
  });

  const systemTemplates = templates.filter((t) => t.is_system);
  const customTemplates = templates.filter((t) => !t.is_system);

  const handleUseTemplate = (tmpl: TemplateData & { categories?: { slug: string; name: string } | null }) => {
    const params = new URLSearchParams();
    if (tmpl.category_id) params.set("template_category", tmpl.category_id);
    const prefill = tmpl.prefill_data || {};
    if (prefill.startTime) params.set("pf_startTime", prefill.startTime);
    if (prefill.endTime) params.set("pf_endTime", prefill.endTime);
    if (prefill.ctaButtonText) params.set("pf_cta", prefill.ctaButtonText);
    if (prefill.organizer) params.set("pf_organizer", prefill.organizer);
    if (prefill.shortDescription) params.set("pf_desc", prefill.shortDescription);
    navigate(`/app/events/new?${params.toString()}`);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t.nav.templates}</h1>
          <p className="text-sm text-muted-foreground mt-1">Kies een sjabloon om in seconden een evenement aan te maken</p>
        </div>
      </div>

      {/* Quick start tip */}
      <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-4 flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-primary shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Snel starten?</p>
          <p className="text-xs text-muted-foreground">Kies een sjabloon — alle velden worden slim vooringevuld. Of maak je eigen sjabloon van een bestaand event.</p>
        </div>
      </div>

      {/* System templates */}
      <div>
        <h2 className="text-sm font-display font-semibold text-foreground mb-3">Standaard sjablonen</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {systemTemplates.map((tmpl, i) => {
            const emoji = CATEGORY_EMOJI[tmpl.categories?.slug || ""] || "📋";
            return (
              <motion.div key={tmpl.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <button
                  onClick={() => handleUseTemplate(tmpl)}
                  className="w-full text-left p-5 rounded-xl bg-card border border-border shadow-card hover:shadow-elevated hover:border-primary/30 transition-all group"
                >
                  <div className="text-2xl mb-2">{emoji}</div>
                  <h3 className="font-display font-semibold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">{tmpl.name}</h3>
                  {tmpl.categories && (
                    <p className="text-[11px] text-muted-foreground">Categorie: {tmpl.categories.name}</p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-primary font-medium mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Gebruik sjabloon <ArrowRight className="w-3 h-3" />
                  </div>
                </button>
              </motion.div>
            );
          })}

          {/* Blank template */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: systemTemplates.length * 0.04 }}>
            <Link
              to="/app/events/new"
              className="block p-5 rounded-xl border-2 border-dashed border-border hover:border-primary/30 transition-all group h-full"
            >
              <div className="flex flex-col items-center justify-center text-center h-full min-h-[100px]">
                <Layers className="w-7 h-7 text-muted-foreground/30 mb-2" />
                <h3 className="font-display font-semibold text-foreground text-sm mb-0.5 group-hover:text-primary transition-colors">Blanco event</h3>
                <p className="text-[11px] text-muted-foreground">Begin helemaal leeg</p>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Custom templates */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-display font-semibold text-foreground">Mijn sjablonen</h2>
          {recentEvents.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                  <Plus className="w-3.5 h-3.5" />
                  Maak van event
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {recentEvents.map((ev) => (
                  <DropdownMenuItem key={ev.id} onClick={() => saveEventAsTemplate.mutate(ev)}>
                    <Calendar className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                    {ev.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {customTemplates.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-border text-center">
            <Copy className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Nog geen eigen sjablonen. Maak er een van een bestaand event via de knop hierboven.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {customTemplates.map((tmpl, i) => (
              <motion.div key={tmpl.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="p-5 rounded-xl bg-card border border-border shadow-card hover:shadow-elevated transition-all group relative">
                  <div className="absolute top-3 right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded-md hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100">
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteTemplate.mutate(tmpl.id)}>
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          Verwijderen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <button onClick={() => handleUseTemplate(tmpl)} className="w-full text-left">
                    <div className="text-2xl mb-2">📋</div>
                    <h3 className="font-display font-semibold text-foreground text-sm mb-1 group-hover:text-primary transition-colors pr-6">{tmpl.name}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Aangemaakt {new Date(tmpl.created_at).toLocaleDateString("nl-NL")}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-primary font-medium mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      Gebruik sjabloon <ArrowRight className="w-3 h-3" />
                    </div>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
