import { Link, useNavigate } from "react-router-dom";
import { Layers, ArrowRight, Sparkles, Plus, MoreVertical, Trash2, Copy, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useUILanguage";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  const { t, language } = useTranslation();
  const { tenantId } = useTenant();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
      toast.success(t("templates.deleted"));
    },
  });

  const saveEventAsTemplate = useMutation({
    mutationFn: async (event: typeof recentEvents[0]) => {
      await supabase.from("event_templates").insert({
        name: `${event.title} ${t("templates.fromEventSuffix")}`,
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
      toast.success(t("templates.savedAs"));
    },
  });

  const systemTemplates = templates.filter((tp) => tp.is_system);
  const customTemplates = templates.filter((tp) => !tp.is_system);

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

  const dateLocale = language === "en" ? "en-US" : "nl-NL";

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t("templates.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("templates.subtitle")}</p>
        </div>
      </div>

      <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-4 flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-primary shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">{t("templates.quickStartTitle")}</p>
          <p className="text-xs text-muted-foreground">{t("templates.quickStartDesc")}</p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-display font-semibold text-foreground mb-3">{t("templates.systemHeader")}</h2>
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
                    <p className="text-xs text-muted-foreground">{t("templates.category")}: {tmpl.categories.name}</p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-primary font-medium mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {t("templates.useTemplate")} <ArrowRight className="w-3 h-3" />
                  </div>
                </button>
              </motion.div>
            );
          })}

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: systemTemplates.length * 0.04 }}>
            <Link
              to="/app/events/new"
              className="block p-5 rounded-xl border-2 border-dashed border-border hover:border-primary/30 transition-all group h-full"
            >
              <div className="flex flex-col items-center justify-center text-center h-full min-h-[100px]">
                <Layers className="w-7 h-7 text-muted-foreground/30 mb-2" />
                <h3 className="font-display font-semibold text-foreground text-sm mb-0.5 group-hover:text-primary transition-colors">{t("templates.blankTitle")}</h3>
                <p className="text-xs text-muted-foreground">{t("templates.blankDesc")}</p>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-display font-semibold text-foreground">{t("templates.customHeader")}</h2>
          {recentEvents.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                  <Plus className="w-3.5 h-3.5" />
                  {t("templates.makeFromEvent")}
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
            <p className="text-xs text-muted-foreground">{t("templates.noCustom")}</p>
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
                          {t("common.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <button onClick={() => handleUseTemplate(tmpl)} className="w-full text-left">
                    <div className="text-2xl mb-2">📋</div>
                    <h3 className="font-display font-semibold text-foreground text-sm mb-1 group-hover:text-primary transition-colors pr-6">{tmpl.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {t("templates.created", { date: new Date(tmpl.created_at).toLocaleDateString(dateLocale) })}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-primary font-medium mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {t("templates.useTemplate")} <ArrowRight className="w-3 h-3" />
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
