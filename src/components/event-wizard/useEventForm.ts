import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/hooks/useAuth";
import { logAudit } from "@/lib/audit";
import type { Tables } from "@/integrations/supabase/types";

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
  recurringInterval: number;
  recurringDays: number[];
  recurringEndDate: string;
  publishAt: string;
  showOnDiscovery: string;
  featuredImageId: string | null;
  featuredImageUrl: string | null;
  sponsors: { name: string; logo_url: string; website_url: string }[];
}

export function useEventForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const template = searchParams.get("template");
  const templateCategory = searchParams.get("template_category");
  const { tenantId } = useTenant();
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
    organizer: pfOrganizer,
    startDate: "",
    endDate: "",
    startTime: pfStartTime,
    endTime: pfEndTime,
    venue: "",
    address: "",
    ctaButtonText: pfCta,
    ctaLink: "",
    tags: "",
    slug: "",
    seoTitle: "",
    seoDescription: "",
    whatsappText: "",
    socialText: "",
    isRecurring: false,
    recurringFreq: "weekly",
    recurringInterval: 1,
    recurringDays: [],
    recurringEndDate: "",
    publishAt: "",
    showOnDiscovery: "inherit",
    featuredImageId: null,
    featuredImageUrl: null,
    sponsors: [],
  });

  const [availableCategories, setAvailableCategories] = useState<Pick<Tables<"categories">, "id" | "name" | "slug">[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<Tables<"media">[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateForm = useCallback((updates: Partial<EventFormState>) => {
    setForm(prev => ({ ...prev, ...updates }));
  }, []);

  // Load categories
  useEffect(() => {
    supabase.from("categories").select("id, name, slug").order("sort_order")
      .then(({ data }) => setAvailableCategories(data || []));
  }, []);

  // Match template to category
  useEffect(() => {
    if (isEditing || !template || form.category || availableCategories.length === 0) return;
    const match = availableCategories.find(c => c.slug === template);
    if (match) updateForm({ category: match.id });
  }, [availableCategories, form.category, isEditing, template, updateForm]);

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
        if (data.featured_image_id) {
          const { data: img } = await supabase.from("media").select("original_url").eq("id", data.featured_image_id).maybeSingle();
          if (img) updates.featuredImageUrl = img.original_url;
        }
        const { data: spData } = await supabase.from("event_sponsors").select("*").eq("event_id", data.id).order("sort_order");
        if (spData) updates.sponsors = spData.map(s => ({ name: s.name, logo_url: s.logo_url || "", website_url: s.website_url || "" }));
        updateForm(updates);
      }
      setLoading(false);
    });
  }, [id, updateForm]);

  // Auto-slug
  useEffect(() => {
    if (!isEditing && form.title) {
      setForm(prev => ({ ...prev, slug: generateSlug(prev.title) }));
    }
  }, [form.title, isEditing]);

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

  async function handleSave() {
    if (!tenantId || !form.title || !form.startDate || !form.startTime) {
      toast.error("Vul minimaal titel, datum en tijd in");
      return false;
    }
    setSaving(true);
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
    }
    if (!error && eventId) await saveSponsors(eventId);
    setSaving(false);
    if (error) {
      toast.error("Opslaan mislukt: " + error.message);
      return false;
    }
    toast.success("Concept opgeslagen");
    logAudit({ tenantId, entityType: "event", action: isEditing ? "updated" : "created", entityId: eventId });
    if (!isEditing) navigate("/app/events");
    return true;
  }

  async function handlePublish() {
    if (!tenantId || !form.title || !form.startDate || !form.startTime) {
      toast.error("Vul minimaal titel, datum en tijd in");
      return false;
    }
    setSaving(true);
    const status = form.publishAt ? "scheduled" : "published";
    const data = buildEventData(status);
    let error;
    let eventId = id;
    if (isEditing) {
      const { tenant_id, created_by, ...updateData } = data;
      ({ error } = await supabase.from("events").update(updateData).eq("id", id!));
    } else {
      const res = await supabase.from("events").insert(data).select("id").single();
      error = res.error;
      eventId = res.data?.id;
    }
    if (!error && eventId) await saveSponsors(eventId);
    setSaving(false);
    if (error) {
      toast.error("Publiceren mislukt: " + error.message);
      return false;
    }
    toast.success(status === "scheduled" ? "Evenement ingepland! 📅" : "Evenement gepubliceerd! 🎉");
    logAudit({ tenantId, entityType: "event", action: status === "scheduled" ? "scheduled" : "published", entityId: eventId });
    navigate("/app/events");
    return true;
  }

  async function handleDelete() {
    if (!id || !confirm("Weet je zeker dat je dit evenement wilt verwijderen?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) toast.error("Verwijderen mislukt: " + error.message);
    else { toast.success("Evenement verwijderd"); navigate("/app/events"); }
  }

  return {
    form, updateForm, isEditing, id, saving, loading,
    availableCategories,
    mediaPickerOpen, setMediaPickerOpen,
    mediaItems, mediaLoading, uploading,
    fileInputRef, openMediaPicker, handleMediaUpload,
    loadMediaItems,
    handleSave, handlePublish, handleDelete,
    navigate,
  };
}
