import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams, useBlocker } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/hooks/useAuth";
import { logAudit } from "@/lib/audit";
import { triggerClickWiseSync } from "@/lib/clickwise-sync";
import type { Tables } from "@/integrations/supabase/types";
import { generatePreviewDates } from "./StepDateTime";
import type { RecurringEditScope } from "./RecurringEditScopeDialog";

function generateSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function toDatetimeLocal(isoString: string | null): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

/**
 * Capture only fields that affect occurrence generation.
 * Used to detect whether the recurrence rule itself changed.
 */
function recurrenceSignature(f: Partial<EventFormState>): string {
  return JSON.stringify({
    isRecurring: f.isRecurring,
    startDate: f.startDate,
    recurringFreq: f.recurringFreq,
    recurringCustomFreq: f.recurringCustomFreq,
    recurringInterval: f.recurringInterval,
    recurringDays: f.recurringDays,
    recurringEndType: f.recurringEndType,
    recurringEndDate: f.recurringEndDate,
    recurringEndCount: f.recurringEndCount,
  });
}

export interface EventFormState {
  title: string;
  subtitle: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  organizer: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  venueId: string;
  venue: string;
  address: string;
  ctaButtonText: string;
  ctaLink: string;
  tags: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  whatsappText: string;
  socialText: string;
  isRecurring: boolean;
  recurringFreq: string;
  recurringCustomFreq: string;
  recurringInterval: number;
  recurringDays: number[];
  recurringEndType: string;
  recurringEndDate: string;
  recurringEndCount: number;
  publishAt: string;
  showOnDiscovery: string;
  featuredImageId: string | null;
  featuredImageUrl: string | null;
  sponsors: { name: string; logo_url: string; website_url: string }[];
  gallery: { mediaId: string; url: string }[];
}

export interface StepValidation {
  isValid: boolean;
  errors: string[];
}

const AUTOSAVE_DELAY_MS = 1500; // 1.5 seconds for snappy "concept saved" feedback

export function useEventForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const template = searchParams.get("template");
  const templateCategory = searchParams.get("template_category");
  const { tenantId, tenant } = useTenant();
  const { user } = useAuth();
  const isEditing = !!id;

  // Prefill from template URL params
  const pfStartTime = searchParams.get("pf_startTime") || "20:00";
  const pfEndTime = searchParams.get("pf_endTime") || "23:00";
  const pfCta = searchParams.get("pf_cta") || "Reserveer nu";
  const pfOrganizer = searchParams.get("pf_organizer") || "";
  const pfDesc = searchParams.get("pf_desc") || "";

  const [form, setForm] = useState<EventFormState>({
    title: "",
    subtitle: "",
    shortDescription: pfDesc,
    fullDescription: "",
    category: templateCategory || template || "",
    organizer: pfOrganizer || tenant?.name || "",
    startDate: "",
    endDate: "",
    startTime: pfStartTime,
    endTime: pfEndTime,
    venueId: "",
    venue: "",
    address: "",
    ctaButtonText: pfCta,
    ctaLink: tenant?.website_url || "",
    tags: "",
    slug: "",
    seoTitle: "",
    seoDescription: "",
    whatsappText: "",
    socialText: "",
    isRecurring: false,
    recurringFreq: "weekly",
    recurringCustomFreq: "weekly",
    recurringInterval: 1,
    recurringDays: [],
    recurringEndType: "never",
    recurringEndDate: "",
    recurringEndCount: 10,
    publishAt: "",
    showOnDiscovery: "inherit",
    featuredImageId: null,
    featuredImageUrl: null,
    sponsors: [],
    gallery: [],
  });

  const [availableCategories, setAvailableCategories] = useState<Pick<Tables<"categories">, "id" | "name" | "slug">[]>([]);
  const [venues, setVenues] = useState<Tables<"venues">[]>([]);
  const [saving, setSaving] = useState(false);
  const [autosaving, setAutosaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<Tables<"media">[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [autoSavedEventId, setAutoSavedEventId] = useState<string | null>(id || null);
  const [publishedEventId, setPublishedEventId] = useState<string | null>(null);
  const [publishedStatus, setPublishedStatus] = useState<"published" | "scheduled" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialFormRef = useRef<string>("");
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedStatusRef = useRef<string>("draft");
  // Original recurrence snapshot to detect actual rule changes
  const initialRecurrenceRef = useRef<string>("");
  // Pending recurring save awaiting scope choice
  const [pendingRecurringSave, setPendingRecurringSave] = useState<null | {
    intent: "save" | "publish";
    futureCount: number;
    totalCount: number;
    hasManualEdits: boolean;
  }>(null);

  const updateForm = useCallback((updates: Partial<EventFormState>) => {
    setForm(prev => {
      const next = { ...prev, ...updates };
      return next;
    });
    setIsDirty(true);
  }, []);

  // Track dirty state
  useEffect(() => {
    if (!loading) {
      const current = JSON.stringify(form);
      if (initialFormRef.current && current !== initialFormRef.current) {
        setIsDirty(true);
      }
    }
  }, [form, loading]);

  // Unsaved changes warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Autosave drafts: works for both existing drafts and brand-new events (creates first, then updates).
  // Skipped for already-published events (those require explicit "Save changes").
  useEffect(() => {
    if (!isDirty || !tenantId) return;
    if (loadedStatusRef.current === "published" || loadedStatusRef.current === "scheduled") return;
    if (!form.title.trim()) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(async () => {
      setAutosaving(true);
      try {
        const data = buildEventData("draft");
        if (autoSavedEventId) {
          const { tenant_id, created_by, ...updateData } = data;
          const { error } = await supabase.from("events").update(updateData).eq("id", autoSavedEventId);
          if (error) return;
        } else {
          const { data: inserted, error } = await supabase.from("events").insert(data).select("id").single();
          if (error || !inserted) return;
          setAutoSavedEventId(inserted.id);
          // Replace URL silently so refresh works, without triggering a full reload
          window.history.replaceState(null, "", `/app/events/${inserted.id}`);
        }
        setLastSavedAt(new Date());
        setIsDirty(false);
        initialFormRef.current = JSON.stringify(form);
      } finally {
        setAutosaving(false);
      }
    }, AUTOSAVE_DELAY_MS);
    return () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current); };
  }, [isDirty, autoSavedEventId, tenantId, form]);

  // Load categories + venues
  useEffect(() => {
    supabase.from("categories").select("id, name, slug").order("sort_order")
      .then(({ data }) => setAvailableCategories(data || []));
    if (tenantId) {
      supabase.from("venues").select("*").eq("tenant_id", tenantId).order("is_primary", { ascending: false })
        .then(({ data }) => {
          setVenues(data || []);
          // Auto-select primary venue for new events
          if (!isEditing && data && data.length > 0) {
            const primary = data.find(v => v.is_primary) || data[0];
            setForm(prev => ({
              ...prev,
              venueId: prev.venueId || primary.id,
              venue: prev.venue || primary.name,
              address: prev.address || [primary.address, primary.city].filter(Boolean).join(", "),
            }));
          }
        });
    }
  }, [tenantId, isEditing]);

  // Match template to category
  useEffect(() => {
    if (isEditing || form.category || availableCategories.length === 0) return;
    const matchId = templateCategory && availableCategories.find(c => c.id === templateCategory);
    const matchSlug = template && availableCategories.find(c => c.slug === template);
    const match = matchId || matchSlug;
    if (match) updateForm({ category: match.id });
  }, [availableCategories, form.category, isEditing, template, templateCategory, updateForm]);

  // Load existing event
  useEffect(() => {
    if (!id) return;
    supabase.from("events").select("*").eq("id", id).maybeSingle().then(async ({ data }) => {
      if (data) {
        const updates: Partial<EventFormState> = {
          title: data.title,
          subtitle: data.subtitle || "",
          shortDescription: data.short_description || "",
          fullDescription: data.full_description || "",
          category: data.category_id || "",
          organizer: data.organizer_name || "",
          startDate: data.start_date,
          endDate: data.end_date || "",
          startTime: data.start_time,
          endTime: data.end_time || "",
          venueId: data.venue_id || "",
          ctaButtonText: data.cta_button_text || "",
          ctaLink: data.cta_link || "",
          tags: data.tags?.join(", ") || "",
          slug: data.slug,
          seoTitle: data.seo_title || "",
          seoDescription: data.seo_description || "",
          whatsappText: data.whatsapp_share_text || "",
          socialText: data.social_share_text || "",
          isRecurring: data.is_recurring,
          publishAt: toDatetimeLocal(data.publish_at),
          showOnDiscovery:
            (data as any).show_on_discovery === true ? "show" :
            (data as any).show_on_discovery === false ? "hide" : "inherit",
          featuredImageId: data.featured_image_id,
        };
        // Load venue info
        if (data.venue_id) {
          const { data: v } = await supabase.from("venues").select("*").eq("id", data.venue_id).maybeSingle();
          if (v) {
            updates.venue = v.name;
            updates.address = [v.address, v.city].filter(Boolean).join(", ");
          }
        }
        if (data.featured_image_id) {
          const { data: img } = await supabase.from("media").select("original_url").eq("id", data.featured_image_id).maybeSingle();
          if (img) updates.featuredImageUrl = img.original_url;
        }
        const { data: spData } = await supabase.from("event_sponsors").select("*").eq("event_id", data.id).order("sort_order");
        if (spData) updates.sponsors = spData.map(s => ({ name: s.name, logo_url: s.logo_url || "", website_url: s.website_url || "" }));
        const { data: galData } = await supabase
          .from("event_gallery")
          .select("media_id, media:media_id(original_url)")
          .eq("event_id", data.id)
          .order("sort_order");
        if (galData) {
          updates.gallery = galData
            .map((g: any) => ({ mediaId: g.media_id, url: g.media?.original_url || "" }))
            .filter((g) => g.url);
        }
        loadedStatusRef.current = data.status;
        setForm(prev => ({ ...prev, ...updates }));
        setTimeout(() => {
          const merged = { ...form, ...updates };
          initialFormRef.current = JSON.stringify(merged);
          initialRecurrenceRef.current = recurrenceSignature(merged);
          setIsDirty(false);
        }, 100);
      }
      setLoading(false);
    });
  }, [id]);

  // Auto-slug
  useEffect(() => {
    if (!isEditing && form.title) {
      setForm(prev => ({ ...prev, slug: generateSlug(prev.title) }));
    }
  }, [form.title, isEditing]);

  // Smart default: when start time is set and end time is empty, suggest +3h
  useEffect(() => {
    if (form.startTime && !form.endTime) {
      const [h, m] = form.startTime.split(":").map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        const endH = (h + 3) % 24;
        const suggested = `${endH.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
        setForm(prev => prev.endTime ? prev : { ...prev, endTime: suggested });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.startTime]);

  // Smart default: fill organizer from tenant once tenant loads (for new events)
  useEffect(() => {
    if (!isEditing && tenant?.name && !form.organizer) {
      setForm(prev => prev.organizer ? prev : { ...prev, organizer: tenant.name });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.name, isEditing]);

  // Step validation
  function validateStep(step: number): StepValidation {
    const errors: string[] = [];
    switch (step) {
      case 1:
        if (!form.title.trim()) errors.push("Titel is verplicht");
        if (form.title.length > 100) errors.push("Titel mag maximaal 100 tekens zijn");
        if (form.shortDescription.length > 160) errors.push("Korte beschrijving mag maximaal 160 tekens zijn");
        break;
      case 2:
        if (!form.startDate) errors.push("Startdatum is verplicht");
        if (!form.startTime) errors.push("Starttijd is verplicht");
        if (form.endDate && form.startDate && form.endDate < form.startDate) errors.push("Einddatum moet na startdatum liggen");
        break;
      case 3:
        // Content & media is optional
        break;
      case 4:
        if (form.ctaLink && !form.ctaLink.startsWith("http")) errors.push("CTA link moet beginnen met http(s)://");
        if (form.seoTitle && form.seoTitle.length > 60) errors.push("SEO titel mag maximaal 60 tekens zijn");
        if (form.seoDescription && form.seoDescription.length > 160) errors.push("SEO beschrijving mag maximaal 160 tekens zijn");
        break;
      case 5:
        if (!form.title.trim()) errors.push("Titel is verplicht om te publiceren");
        if (!form.startDate) errors.push("Startdatum is verplicht om te publiceren");
        if (!form.startTime) errors.push("Starttijd is verplicht om te publiceren");
        break;
    }
    return { isValid: errors.length === 0, errors };
  }

  async function loadMediaItems() {
    if (!tenantId) return;
    setMediaLoading(true);
    const { data } = await supabase.from("media").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
    setMediaItems((data as Tables<"media">[]) || []);
    setMediaLoading(false);
  }

  async function handleMediaUpload(files: FileList | null) {
    if (!files || !tenantId) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${tenantId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("media").upload(path, file);
      if (uploadError) { toast.error(`Upload mislukt: ${file.name}`); continue; }
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
      await supabase.from("media").insert({
        tenant_id: tenantId,
        filename: file.name,
        storage_path: path,
        original_url: urlData.publicUrl,
        mime_type: file.type,
        file_size: file.size,
        source: "upload" as const,
      });
    }
    setUploading(false);
    toast.success("Upload voltooid");
    await loadMediaItems();
  }

  function openMediaPicker() {
    loadMediaItems();
    setMediaPickerOpen(true);
  }

  function buildEventData(status: "draft" | "published" | "scheduled") {
    return {
      title: form.title,
      subtitle: form.subtitle || null,
      short_description: form.shortDescription || null,
      full_description: form.fullDescription || null,
      category_id: form.category || null,
      organizer_name: form.organizer || null,
      start_date: form.startDate,
      end_date: form.endDate || null,
      start_time: form.startTime,
      end_time: form.endTime || null,
      venue_id: form.venueId || null,
      cta_button_text: form.ctaButtonText || null,
      cta_link: form.ctaLink || null,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : null,
      slug: form.slug || generateSlug(form.title),
      seo_title: form.seoTitle || null,
      seo_description: form.seoDescription || null,
      whatsapp_share_text: form.whatsappText || null,
      social_share_text: form.socialText || null,
      is_recurring: form.isRecurring,
      publish_at: status === "scheduled" && form.publishAt ? new Date(form.publishAt).toISOString() : null,
      featured_image_id: form.featuredImageId,
      show_on_discovery: form.showOnDiscovery === "show" ? true : form.showOnDiscovery === "hide" ? false : null,
      status,
      tenant_id: tenantId!,
      created_by: user?.id || null,
    } as any;
  }

  async function saveSponsors(eventId: string) {
    await supabase.from("event_sponsors").delete().eq("event_id", eventId);
    const valid = form.sponsors.filter(s => s.name.trim());
    if (valid.length > 0) {
      await supabase.from("event_sponsors").insert(
        valid.map((s, i) => ({
          event_id: eventId,
          name: s.name.trim(),
          logo_url: s.logo_url || null,
          website_url: s.website_url || null,
          sort_order: i,
        }))
      );
    }
  }

  async function saveGallery(eventId: string) {
    await supabase.from("event_gallery").delete().eq("event_id", eventId);
    const valid = form.gallery.filter((g) => g.mediaId);
    if (valid.length > 0) {
      await supabase.from("event_gallery").insert(
        valid.map((g, i) => ({
          event_id: eventId,
          media_id: g.mediaId,
          sort_order: i,
        }))
      );
    }
  }

  /**
   * Inspecteer bestaande occurrences om te bepalen of een scope-keuze
   * relevant is. Wordt gebruikt voor de RecurringEditScopeDialog.
   */
  async function inspectExistingOccurrences(eventId: string): Promise<{
    total: number;
    future: number;
    hasManualEdits: boolean;
  }> {
    const { data } = await supabase
      .from("event_occurrences")
      .select("occurrence_date, status, overrides, start_time, end_time, label")
      .eq("event_id", eventId);
    const today = new Date().toISOString().split("T")[0];
    const list = data || [];
    const future = list.filter(o => o.occurrence_date >= today).length;
    const hasManualEdits = list.some(o =>
      (o.status && o.status !== "active") ||
      o.label ||
      (o.overrides && Object.keys(o.overrides as object).length > 0)
    );
    return { total: list.length, future, hasManualEdits };
  }

  async function generateOccurrences(
    eventId: string,
    scope: RecurringEditScope = "future",
  ) {
    if (!form.isRecurring || !tenantId) return;
    const dates = generatePreviewDates(form);
    if (dates.length === 0) return;

    if (scope === "single") return; // master-edit raakt geen reeks aan

    const today = new Date().toISOString().split("T")[0];

    if (scope === "all") {
      // Volledige rebuild: vervang alles. Manuele aanpassingen gaan verloren.
      await supabase.from("event_occurrences").delete().eq("event_id", eventId);
      const rows = dates.map((occurrence_date) => ({
        event_id: eventId,
        tenant_id: tenantId,
        occurrence_date,
        start_time: form.startTime || null,
        end_time: form.endTime || null,
        status: "active" as const,
      }));
      for (let i = 0; i < rows.length; i += 50) {
        await supabase.from("event_occurrences").insert(rows.slice(i, i + 50));
      }
      return;
    }

    // scope === "future" — niet-destructieve merge, alleen toekomst
    const { mergeOccurrences } = await import("@/lib/recurrence");
    const { data: existing } = await supabase
      .from("event_occurrences")
      .select("id, occurrence_date, start_time, end_time, status, label, overrides")
      .eq("event_id", eventId);

    const existingTyped = (existing || []).map(o => ({
      id: o.id,
      occurrence_date: o.occurrence_date,
      start_time: o.start_time,
      end_time: o.end_time,
      status: o.status,
      label: o.label,
      overrides: (o.overrides as Record<string, unknown>) || {},
    }));

    const merge = mergeOccurrences(
      dates,
      existingTyped,
      form.startTime || null,
      form.endTime || null,
    );

    // Filter delete-set: nooit verleden datums verwijderen.
    const safeDelete = merge.toDelete.filter(id => {
      const occ = existingTyped.find(e => e.id === id);
      return !!occ && occ.occurrence_date >= today;
    });
    if (safeDelete.length > 0) {
      await supabase.from("event_occurrences").delete().in("id", safeDelete);
    }

    // Insert alleen toekomstige nieuwe datums.
    const rows = merge.toInsert
      .filter(({ occurrence_date }) => occurrence_date >= today)
      .map(({ occurrence_date }) => ({
        event_id: eventId,
        tenant_id: tenantId,
        occurrence_date,
        start_time: form.startTime || null,
        end_time: form.endTime || null,
        status: "active" as const,
      }));
    for (let i = 0; i < rows.length; i += 50) {
      await supabase.from("event_occurrences").insert(rows.slice(i, i + 50));
    }
  }

  async function ensureVenue() {
    if (form.venue.trim() && !form.venueId && tenantId) {
      const parts = form.address.split(",").map(s => s.trim());
      const { data: newVenue } = await supabase.from("venues").insert({
        tenant_id: tenantId,
        name: form.venue.trim(),
        address: parts[0] || null,
        city: parts[1] || null,
      }).select("id").single();
      if (newVenue) {
        form.venueId = newVenue.id;
        setForm(prev => ({ ...prev, venueId: newVenue.id }));
      }
    }
  }

  /**
   * Bepaalt of een gebruiker een scope-keuze moet maken voor recurring saves.
   * - Alleen bij bestaand event (eventId aanwezig)
   * - Recurring aan
   * - Bestaande occurrences > 0
   * - Recurrence rule daadwerkelijk gewijzigd t.o.v. snapshot bij load
   */
  async function shouldPromptRecurringScope(eventId: string | undefined): Promise<
    | null
    | { futureCount: number; totalCount: number; hasManualEdits: boolean }
  > {
    if (!eventId || !form.isRecurring) return null;
    if (!initialRecurrenceRef.current) return null;
    const current = recurrenceSignature(form);
    if (current === initialRecurrenceRef.current) return null;
    const info = await inspectExistingOccurrences(eventId);
    if (info.total === 0) return null;
    return { futureCount: info.future, totalCount: info.total, hasManualEdits: info.hasManualEdits };
  }

  async function performSave(scope: RecurringEditScope = "future") {
    if (!tenantId || !form.title.trim()) {
      toast.error("Vul minimaal een titel in om op te slaan");
      return false;
    }
    setSaving(true);
    await ensureVenue();
    const data = buildEventData("draft");
    let error;
    let eventId = id;
    if (isEditing) {
      const { tenant_id, created_by, ...updateData } = data;
      ({ error } = await supabase.from("events").update(updateData).eq("id", id!));
    } else {
      const res = await supabase.from("events").insert(data).select("id").single();
      error = res.error;
      eventId = res.data?.id;
      if (eventId) setAutoSavedEventId(eventId);
    }
    if (!error && eventId) {
      await saveSponsors(eventId);
      await saveGallery(eventId);
      if (form.isRecurring) await generateOccurrences(eventId, scope);
    }
    setSaving(false);
    if (error) {
      toast.error("Opslaan mislukt: " + error.message);
      return false;
    }
    setIsDirty(false);
    setLastSavedAt(new Date());
    initialFormRef.current = JSON.stringify(form);
    initialRecurrenceRef.current = recurrenceSignature(form);
    toast.success("Concept opgeslagen ✓");
    logAudit({ tenantId, entityType: "event", action: isEditing ? "updated" : "created", entityId: eventId });
    if (isEditing && eventId && loadedStatusRef.current === "published") {
      triggerClickWiseSync(tenantId, "event.updated", eventId, { title: form.title, slug: form.slug });
    }
    if (!isEditing && eventId) {
      window.history.replaceState(null, "", `/app/events/${eventId}`);
    }
    return true;
  }

  async function handleSave() {
    const eventId = id || autoSavedEventId;
    const prompt = await shouldPromptRecurringScope(eventId);
    if (prompt) {
      setPendingRecurringSave({ intent: "save", ...prompt });
      return false;
    }
    return performSave("future");
  }

  async function performPublish(scope: RecurringEditScope = "future") {
    const validation = validateStep(5);
    if (!validation.isValid) {
      validation.errors.forEach(err => toast.error(err));
      return false;
    }
    if (!tenantId) return false;
    setSaving(true);
    await ensureVenue();
    const status = form.publishAt ? "scheduled" : "published";
    const data = buildEventData(status);
    let error;
    let eventId = autoSavedEventId || id;
    if (eventId) {
      const { tenant_id, created_by, ...updateData } = data;
      ({ error } = await supabase.from("events").update(updateData).eq("id", eventId));
    } else {
      const res = await supabase.from("events").insert(data).select("id").single();
      error = res.error;
      eventId = res.data?.id;
    }
    if (!error && eventId) {
      await saveSponsors(eventId);
      await saveGallery(eventId);
      if (form.isRecurring) await generateOccurrences(eventId, scope);
    }
    setSaving(false);
    if (error) {
      toast.error("Publiceren mislukt: " + error.message);
      return false;
    }
    setIsDirty(false);
    initialFormRef.current = JSON.stringify(form);
    initialRecurrenceRef.current = recurrenceSignature(form);
    const syncEventType = isEditing && loadedStatusRef.current === "published"
      ? "event.updated"
      : "event.published";
    logAudit({ tenantId, entityType: "event", action: status === "scheduled" ? "scheduled" : "published", entityId: eventId });
    if (status === "published" && eventId) {
      triggerClickWiseSync(tenantId, syncEventType, eventId, { title: form.title, slug: form.slug });
    }
    setPublishedEventId(eventId!);
    setPublishedStatus(status as "published" | "scheduled");
    loadedStatusRef.current = status;
    return true;
  }

  async function handlePublish() {
    const eventId = id || autoSavedEventId;
    const prompt = await shouldPromptRecurringScope(eventId);
    if (prompt) {
      setPendingRecurringSave({ intent: "publish", ...prompt });
      return false;
    }
    return performPublish("future");
  }

  async function confirmRecurringScope(scope: RecurringEditScope) {
    const intent = pendingRecurringSave?.intent;
    setPendingRecurringSave(null);
    if (intent === "publish") return performPublish(scope);
    if (intent === "save") return performSave(scope);
    return false;
  }

  function cancelRecurringScope() {
    setPendingRecurringSave(null);
  }

  function dismissPublishSuccess() {
    setPublishedEventId(null);
    setPublishedStatus(null);
  }

  async function handleDelete() {
    if (!id || !confirm("Weet je zeker dat je dit evenement wilt verwijderen? Dit kan niet ongedaan worden gemaakt.")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) toast.error("Verwijderen mislukt: " + error.message);
    else { toast.success("Evenement verwijderd"); navigate("/app/events"); }
  }

  return {
    form, updateForm, isEditing, id, saving, autosaving, loading,
    availableCategories, venues,
    mediaPickerOpen, setMediaPickerOpen,
    mediaItems, mediaLoading, uploading,
    fileInputRef, openMediaPicker, handleMediaUpload,
    loadMediaItems,
    handleSave, handlePublish, handleDelete,
    validateStep, isDirty, lastSavedAt,
    publishedEventId, publishedStatus, dismissPublishSuccess,
    pendingRecurringSave, confirmRecurringScope, cancelRecurringScope,
    navigate, tenantId,
  };
}
