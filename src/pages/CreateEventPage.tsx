import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, Eye, Send, Sparkles, Clock, MapPin, CalendarDays, Image, Share2, Repeat, CalendarClock, Trash2, Check, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/hooks/useAuth";
import { logAudit } from "@/lib/audit";
import type { Tables } from "@/integrations/supabase/types";

const categories = Object.entries(t.events.categories);

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

export default function CreateEventPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const template = searchParams.get("template");
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const isEditing = !!id;

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [category, setCategory] = useState(template || "");
  const [organizer, setOrganizer] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("20:00");
  const [endTime, setEndTime] = useState("23:00");
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [ctaButtonText, setCtaButtonText] = useState("Reserveer nu");
  const [ctaLink, setCtaLink] = useState("");
  const [tags, setTags] = useState("");
  const [slug, setSlug] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [whatsappText, setWhatsappText] = useState("");
  const [socialText, setSocialText] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFreq, setRecurringFreq] = useState("weekly");
  const [recurringInterval, setRecurringInterval] = useState(1);
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [recurringEndDate, setRecurringEndDate] = useState("");
  const [publishAt, setPublishAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [featuredImageId, setFeaturedImageId] = useState<string | null>(null);
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<Tables<"media">[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sponsors, setSponsors] = useState<{ name: string; logo_url: string; website_url: string }[]>([]);
  const [sponsorsLoading, setSponsorsLoading] = useState(false);

  // Load existing event when editing
  useEffect(() => {
    if (!id) return;
    supabase.from("events").select("*").eq("id", id).maybeSingle().then(async ({ data }) => {
      if (data) {
        setTitle(data.title);
        setSubtitle(data.subtitle || "");
        setShortDescription(data.short_description || "");
        setFullDescription(data.full_description || "");
        setOrganizer(data.organizer_name || "");
        setStartDate(data.start_date);
        setEndDate(data.end_date || "");
        setStartTime(data.start_time);
        setEndTime(data.end_time || "");
        setCtaButtonText(data.cta_button_text || "");
        setCtaLink(data.cta_link || "");
        setTags(data.tags?.join(", ") || "");
        setSlug(data.slug);
        setSeoTitle(data.seo_title || "");
        setSeoDescription(data.seo_description || "");
        setWhatsappText(data.whatsapp_share_text || "");
        setSocialText(data.social_share_text || "");
        setIsRecurring(data.is_recurring);
        setPublishAt(toDatetimeLocal(data.publish_at));
        setFeaturedImageId(data.featured_image_id);
        if (data.featured_image_id) {
          const { data: img } = await supabase.from("media").select("original_url").eq("id", data.featured_image_id).maybeSingle();
          if (img) setFeaturedImageUrl(img.original_url);
        }
      }
      setLoading(false);
    });
  }, [id]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEditing && title) {
      setSlug(generateSlug(title));
    }
  }, [title, isEditing]);

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
      if (uploadError) {
        toast.error(`Upload mislukt: ${file.name}`);
        continue;
      }
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
      title,
      subtitle: subtitle || null,
      short_description: shortDescription || null,
      full_description: fullDescription || null,
      organizer_name: organizer || null,
      start_date: startDate,
      end_date: endDate || null,
      start_time: startTime,
      end_time: endTime || null,
      cta_button_text: ctaButtonText || null,
      cta_link: ctaLink || null,
      tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : null,
      slug: slug || generateSlug(title),
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      whatsapp_share_text: whatsappText || null,
      social_share_text: socialText || null,
      is_recurring: isRecurring,
      publish_at: status === "scheduled" && publishAt ? new Date(publishAt).toISOString() : null,
      featured_image_id: featuredImageId,
      status,
      tenant_id: tenantId!,
      created_by: user?.id || null,
    };
  }

  async function handleSave() {
    if (!tenantId || !title || !startDate || !startTime) {
      toast.error("Vul minimaal titel, datum en tijd in");
      return;
    }
    setSaving(true);
    const data = buildEventData("draft");
    let error;
    if (isEditing) {
      const { tenant_id, created_by, ...updateData } = data;
      ({ error } = await supabase.from("events").update(updateData).eq("id", id!));
    } else {
      ({ error } = await supabase.from("events").insert(data));
    }
    setSaving(false);
    if (error) {
      toast.error("Opslaan mislukt: " + error.message);
    } else {
      toast.success("Concept opgeslagen");
      logAudit({ tenantId, entityType: "event", action: isEditing ? "updated" : "created", entityId: id });
      if (!isEditing) navigate("/app/events");
    }
  }

  async function handlePublish() {
    if (!tenantId || !title || !startDate || !startTime) {
      toast.error("Vul minimaal titel, datum en tijd in");
      return;
    }
    setSaving(true);
    // If publishAt is set, schedule; otherwise publish immediately
    const status = publishAt ? "scheduled" : "published";
    const data = buildEventData(status);
    let error;
    if (isEditing) {
      const { tenant_id, created_by, ...updateData } = data;
      ({ error } = await supabase.from("events").update(updateData).eq("id", id!));
    } else {
      ({ error } = await supabase.from("events").insert(data));
    }
    setSaving(false);
    if (error) {
      toast.error("Publiceren mislukt: " + error.message);
    } else {
      toast.success(status === "scheduled" ? "Evenement ingepland! 📅" : "Evenement gepubliceerd! 🎉");
      logAudit({ tenantId, entityType: "event", action: status === "scheduled" ? "scheduled" : "published", entityId: id });
      navigate("/app/events");
    }
  }

  async function handleDelete() {
    if (!id || !confirm("Weet je zeker dat je dit evenement wilt verwijderen?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      toast.error("Verwijderen mislukt: " + error.message);
    } else {
      toast.success("Evenement verwijderd");
      navigate("/app/events");
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="max-w-4xl">
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 border-b border-border mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-display font-bold text-foreground truncate">
              {isEditing ? (title || "Evenement bewerken") : (title || t.events.create)}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
              <Button variant="outline" size="sm" onClick={handleDelete} className="gap-2 text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{saving ? "Opslaan..." : t.common.save}</span>
            </Button>
            <Button size="sm" onClick={handlePublish} disabled={saving} className="gap-2 gradient-hero text-primary-foreground border-0 hover:opacity-90">
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{t.common.publish}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="details">
            <TabsList className="mb-6 w-full justify-start">
              <TabsTrigger value="details" className="gap-1.5"><CalendarDays className="w-3.5 h-3.5" />Details</TabsTrigger>
              <TabsTrigger value="media" className="gap-1.5"><Image className="w-3.5 h-3.5" />Media</TabsTrigger>
              <TabsTrigger value="seo" className="gap-1.5"><Share2 className="w-3.5 h-3.5" />SEO & Delen</TabsTrigger>
              <TabsTrigger value="advanced" className="gap-1.5"><Sparkles className="w-3.5 h-3.5" />Geavanceerd</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-5">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.title} *</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bijv. Live Jazz Avond" className="text-lg font-display font-semibold h-12 border-primary/20 focus:border-primary" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.subtitle}</Label>
                  <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Optionele ondertitel" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.category}</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue placeholder="Kies categorie" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.organizer}</Label>
                    <Input value={organizer} onChange={(e) => setOrganizer(e.target.value)} placeholder="Naam organisator" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.shortDescription}</Label>
                  <Textarea value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="Korte beschrijving (max 160 tekens)" rows={2} maxLength={160} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.fullDescription}</Label>
                  <Textarea value={fullDescription} onChange={(e) => setFullDescription(e.target.value)} placeholder="Volledige beschrijving..." rows={5} />
                </div>
                <div className="rounded-xl bg-secondary/30 border border-border p-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground"><CalendarDays className="w-4 h-4 text-primary" />Datum & tijd</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t.events.fields.startDate} *</Label>
                      <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t.events.fields.endDate}</Label>
                      <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t.events.fields.startTime} *</Label>
                      <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t.events.fields.endTime}</Label>
                      <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="rounded-xl bg-secondary/30 border border-border p-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground"><MapPin className="w-4 h-4 text-primary" />Locatie</div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t.events.fields.venue}</Label>
                      <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Locatienaam" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t.events.fields.address}</Label>
                      <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Adres" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.ctaButton}</Label>
                    <Input value={ctaButtonText} onChange={(e) => setCtaButtonText(e.target.value)} placeholder="Reserveer nu" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.ctaLink}</Label>
                    <Input value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} placeholder="https://..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.tags}</Label>
                  <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="bijv. live-muziek, DJ, 80s, retro" />
                  <p className="text-[11px] text-muted-foreground">Voer tags in gescheiden door komma's, zonder # teken. Bijv: <span className="font-mono bg-secondary px-1 rounded">live-muziek, DJ, feest</span></p>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="media" className="space-y-5">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.featuredImage}</Label>
                  {featuredImageUrl ? (
                    <div className="relative rounded-xl border border-border overflow-hidden bg-secondary/20">
                      <div className="aspect-square max-w-md mx-auto">
                        <img src={featuredImageUrl} alt="Featured" className="w-full h-full object-contain" />
                      </div>
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                        <Button size="sm" variant="secondary" onClick={openMediaPicker}>Wijzigen</Button>
                        <Button size="sm" variant="destructive" onClick={() => { setFeaturedImageId(null); setFeaturedImageUrl(null); }}>Verwijderen</Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed border-border rounded-xl p-10 text-center hover:border-primary/50 transition-colors cursor-pointer bg-secondary/20"
                      onClick={openMediaPicker}
                    >
                      <Image className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm font-medium text-foreground mb-1">Kies of upload een afbeelding</p>
                      <p className="text-xs text-muted-foreground">Selecteer uit je mediabibliotheek of upload direct</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-5">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.slug}</Label>
                  <div className="flex items-center gap-0">
                    <span className="text-xs text-muted-foreground bg-secondary px-3 py-2.5 rounded-l-lg border border-r-0 border-border">txeventshare.nl/e/</span>
                    <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="rounded-l-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.seoTitle}</Label>
                  <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="SEO titel (max 60 tekens)" maxLength={60} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.seoDescription}</Label>
                  <Textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder="SEO beschrijving" rows={3} maxLength={160} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.whatsappShareText}</Label>
                  <Textarea value={whatsappText} onChange={(e) => setWhatsappText(e.target.value)} placeholder="Tekst voor WhatsApp" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.socialShareText}</Label>
                  <Textarea value={socialText} onChange={(e) => setSocialText(e.target.value)} placeholder="Tekst voor social media" rows={3} />
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-5">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <div className="rounded-xl bg-card border border-border p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg gradient-accent flex items-center justify-center">
                        <Repeat className="w-4 h-4 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Terugkerend evenement</p>
                        <p className="text-xs text-muted-foreground">Automatisch herhalend op een vast schema</p>
                      </div>
                    </div>
                    <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                  </div>
                  {isRecurring && (
                    <div className="space-y-4 pt-2 border-t border-border">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Frequentie</Label>
                          <Select value={recurringFreq} onValueChange={setRecurringFreq}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Dagelijks</SelectItem>
                              <SelectItem value="weekly">Wekelijks</SelectItem>
                              <SelectItem value="biweekly">Om de 2 weken</SelectItem>
                              <SelectItem value="monthly">Maandelijks</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Elke X keer</Label>
                          <Input type="number" min={1} max={12} value={recurringInterval} onChange={(e) => setRecurringInterval(Number(e.target.value))} />
                        </div>
                      </div>
                      {recurringFreq === "weekly" && (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Op welke dag(en)</Label>
                          <div className="flex gap-1 flex-wrap">
                            {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((day, i) => (
                              <button
                                key={day}
                                type="button"
                                onClick={() => setRecurringDays(prev => prev.includes(i + 1) ? prev.filter(d => d !== i + 1) : [...prev, i + 1])}
                                className={`w-9 h-9 rounded-lg text-xs font-medium transition-colors ${recurringDays.includes(i + 1) ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Eindigt na datum (optioneel)</Label>
                        <Input type="date" value={recurringEndDate} onChange={(e) => setRecurringEndDate(e.target.value)} />
                      </div>
                      <p className="text-[11px] text-muted-foreground">Herhalingen worden automatisch aangemaakt op basis van dit schema.</p>
                    </div>
                  )}
                </div>
                <div className="rounded-xl bg-card border border-border p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg gradient-hero flex items-center justify-center">
                      <CalendarClock className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Ingepland publiceren</p>
                      <p className="text-xs text-muted-foreground">Plan wanneer dit evenement automatisch live gaat</p>
                    </div>
                  </div>
                  <Input type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} className="max-w-xs" />
                  {publishAt && (
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setPublishAt("")}>
                      Wis datum — publiceer direct
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {publishAt
                      ? "Bij klikken op 'Publiceren' wordt het evenement ingepland op deze datum."
                      : "Geen datum ingesteld — bij klikken op 'Publiceren' gaat het direct live."
                    }
                  </p>
                </div>
                <div className="rounded-xl border border-dashed border-border p-5 opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center"><span className="text-lg">🎟️</span></div>
                    <div>
                      <p className="text-sm font-medium text-foreground flex items-center gap-2">Ticketing<span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t.common.futureModule}</span></p>
                      <p className="text-xs text-muted-foreground">Ticketverkoop, QR-scanning & betalingen — binnenkort beschikbaar</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-xl bg-card border border-border shadow-card p-5 space-y-3">
            <h3 className="text-sm font-display font-semibold text-foreground">Status</h3>
            <p className="text-xs text-muted-foreground">
              {isEditing ? "Bewerk dit evenement en sla op of publiceer." : "Maak je event aan als concept of publiceer direct."}
            </p>
          </div>
          <div className="rounded-xl bg-secondary/50 border border-border p-4">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-foreground">💡 Tip</p>
                <p className="text-xs text-muted-foreground mt-0.5">Gebruik de SEO tab om je WhatsApp en social media teksten aan te passen voor maximale impact.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Picker Dialog with Upload */}
      <Dialog open={mediaPickerOpen} onOpenChange={setMediaPickerOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kies een afbeelding</DialogTitle>
          </DialogHeader>
          
          {/* Upload button */}
          <div className="flex gap-2 mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleMediaUpload(e.target.files)}
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2">
              <Upload className="w-4 h-4" />
              {uploading ? "Uploaden..." : "Upload afbeelding"}
            </Button>
          </div>

          {mediaLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : mediaItems.length === 0 ? (
            <div className="text-center py-8">
              <Image className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nog geen media. Klik op "Upload afbeelding" hierboven.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {mediaItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setFeaturedImageId(item.id);
                    setFeaturedImageUrl(item.original_url);
                    setMediaPickerOpen(false);
                  }}
                  className={`relative rounded-lg border-2 overflow-hidden aspect-square transition-colors ${featuredImageId === item.id ? "border-primary" : "border-border hover:border-primary/50"}`}
                >
                  <img src={item.original_url || ""} alt={item.alt_text || item.filename} className="w-full h-full object-cover" />
                  {featuredImageId === item.id && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <Check className="w-6 h-6 text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
