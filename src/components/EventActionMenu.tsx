import { MoreHorizontal, Copy, Share2, Archive, Trash2, Eye, EyeOff, Pencil, ExternalLink, RotateCcw, Hash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";
import { triggerClickWiseSync } from "@/lib/clickwise-sync";
import { useTenant } from "@/hooks/useTenant";
import { useTranslation } from "@/hooks/useUILanguage";

interface EventActionMenuProps {
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  status: string;
  onRefresh?: () => void;
}

export function EventActionMenu({ eventId, eventTitle, eventSlug, status, onRefresh }: EventActionMenuProps) {
  const navigate = useNavigate();
  const { tenantId } = useTenant();
  const { t } = useTranslation();

  function copyEventIdToClipboard() {
    navigator.clipboard.writeText(eventId);
    toast.success(t("events.copyIdDone"));
  }

  async function duplicateEvent() {
    const { data: original, error: fetchErr } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (fetchErr || !original) {
      toast.error("Kon event niet ophalen");
      return;
    }

    const newSlug = original.slug + "-kopie-" + Date.now().toString(36);
    const { data: newEvent, error } = await supabase.from("events").insert({
      tenant_id: original.tenant_id,
      title: original.title + " (kopie)",
      slug: newSlug,
      subtitle: original.subtitle,
      short_description: original.short_description,
      full_description: original.full_description,
      start_date: original.start_date,
      start_time: original.start_time,
      end_date: original.end_date,
      end_time: original.end_time,
      category_id: original.category_id,
      venue_id: original.venue_id,
      featured_image_id: original.featured_image_id,
      cta_link: original.cta_link,
      cta_button_text: original.cta_button_text,
      organizer_name: original.organizer_name,
      tags: original.tags,
      seo_title: original.seo_title,
      seo_description: original.seo_description,
      social_share_text: original.social_share_text,
      whatsapp_share_text: original.whatsapp_share_text,
      auto_end_behavior: original.auto_end_behavior,
      status: "draft",
      created_by: (await supabase.auth.getUser()).data.user?.id || null,
    }).select("id").single();

    if (error) {
      toast.error("Dupliceren mislukt: " + error.message);
    } else {
      toast.success(`"${eventTitle}" gedupliceerd als concept`, {
        action: newEvent?.id ? { label: "Openen", onClick: () => navigate(`/app/events/${newEvent.id}`) } : undefined,
      });
      if (tenantId) logAudit({ tenantId, entityType: "event", action: "duplicated", entityId: eventId });
      onRefresh?.();
    }
  }

  async function archiveEvent() {
    const { error } = await supabase.from("events").update({ status: "archived" }).eq("id", eventId);
    if (error) { toast.error(error.message); return; }
    toast.success(`"${eventTitle}" gearchiveerd`);
    if (tenantId) {
      logAudit({ tenantId, entityType: "event", action: "archived", entityId: eventId });
      triggerClickWiseSync(tenantId, "event.ended", eventId, { title: eventTitle });
    }
    onRefresh?.();
  }

  async function republishEvent() {
    const { error } = await supabase.from("events").update({ status: "published" }).eq("id", eventId);
    if (error) { toast.error(error.message); return; }
    toast.success(`"${eventTitle}" opnieuw gepubliceerd`);
    if (tenantId) {
      logAudit({ tenantId, entityType: "event", action: "published", entityId: eventId });
      triggerClickWiseSync(tenantId, "event.published", eventId, { title: eventTitle });
    }
    onRefresh?.();
  }

  async function unpublishEvent() {
    const { error } = await supabase.from("events").update({ status: "draft" }).eq("id", eventId);
    if (error) { toast.error(error.message); return; }
    toast.success(`"${eventTitle}" gedepubliceerd (terug naar concept)`);
    if (tenantId) {
      logAudit({ tenantId, entityType: "event", action: "unpublished", entityId: eventId });
      triggerClickWiseSync(tenantId, "event.ended", eventId, { title: eventTitle });
    }
    onRefresh?.();
  }

  async function deleteEvent() {
    if (!confirm(`Weet je zeker dat je "${eventTitle}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return;
    // Trigger ClickWise delete sync BEFORE deleting the event from the database
    if (tenantId) {
      await triggerClickWiseSync(tenantId, "event.deleted", eventId, { title: eventTitle });
    }
    const { error } = await supabase.from("events").delete().eq("id", eventId);
    if (error) { toast.error(error.message); return; }
    toast.success(`"${eventTitle}" verwijderd`);
    if (tenantId) logAudit({ tenantId, entityType: "event", action: "deleted", entityId: eventId, metadata: { title: eventTitle } });
    onRefresh?.();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.preventDefault()}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={(e) => { e.preventDefault(); navigate(`/app/events/${eventId}`); }}>
          <Pencil className="w-4 h-4 mr-2" />Bewerken
        </DropdownMenuItem>
        {status === "published" && (
          <DropdownMenuItem onClick={(e) => { e.preventDefault(); window.open(`/e/${eventSlug}`, "_blank"); }}>
            <ExternalLink className="w-4 h-4 mr-2" />Publieke pagina
          </DropdownMenuItem>
        )}
        {status !== "published" && (
          <DropdownMenuItem onClick={(e) => { e.preventDefault(); window.open(`/e/${eventSlug}`, "_blank"); }}>
            <Eye className="w-4 h-4 mr-2" />Preview
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={(e) => { e.preventDefault(); duplicateEvent(); }}>
          <Copy className="w-4 h-4 mr-2" />Dupliceren
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.preventDefault(); copyEventIdToClipboard(); }}>
          <Hash className="w-4 h-4 mr-2" />{t("events.copyId")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.preventDefault(); navigate("/app/distribution"); }}>
          <Share2 className="w-4 h-4 mr-2" />Delen & Posten
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {(status === "archived" || status === "ended") && (
          <DropdownMenuItem onClick={(e) => { e.preventDefault(); republishEvent(); }}>
            <RotateCcw className="w-4 h-4 mr-2" />Opnieuw publiceren
          </DropdownMenuItem>
        )}
        {status === "published" && (
          <DropdownMenuItem onClick={(e) => { e.preventDefault(); unpublishEvent(); }}>
            <EyeOff className="w-4 h-4 mr-2" />Depubliceren
          </DropdownMenuItem>
        )}
        {status !== "archived" && (
          <DropdownMenuItem onClick={(e) => { e.preventDefault(); archiveEvent(); }}>
            <Archive className="w-4 h-4 mr-2" />Archiveren
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.preventDefault(); deleteEvent(); }}>
          <Trash2 className="w-4 h-4 mr-2" />Verwijderen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
