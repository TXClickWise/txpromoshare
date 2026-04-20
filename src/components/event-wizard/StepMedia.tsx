import { Image, Plus, Trash2, ArrowUp, ArrowDown, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { AiFieldActions } from "./AiFieldActions";
import MediaPicker from "@/components/MediaPicker";
import type { EventFormState } from "./useEventForm";
import type { Tables } from "@/integrations/supabase/types";

const MAX_GALLERY = 12;

interface StepMediaProps {
  form: EventFormState;
  updateForm: (updates: Partial<EventFormState>) => void;
  mediaPickerOpen: boolean;
  setMediaPickerOpen: (open: boolean) => void;
  mediaItems: Tables<"media">[];
  mediaLoading: boolean;
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  openMediaPicker: () => void;
  handleMediaUpload: (files: FileList | null) => void;
  categories?: Pick<Tables<"categories">, "id" | "name" | "slug">[];
}

export function StepMedia({
  form, updateForm,
  mediaPickerOpen, setMediaPickerOpen,
  mediaItems, mediaLoading, uploading,
  fileInputRef, openMediaPicker, handleMediaUpload,
  categories = [],
}: StepMediaProps) {
  const categoryName = categories.find((c) => c.id === form.category)?.name || "";
  const eventContext = { title: form.title, category: categoryName, description: form.shortDescription };
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);

  const handleImageSelect = (mediaId: string, url: string) => {
    updateForm({ featuredImageId: mediaId, featuredImageUrl: url });
  };

  const handleGalleryAdd = (items: { id: string; url: string }[]) => {
    const existing = new Set(form.gallery.map((g) => g.mediaId));
    const fresh = items
      .filter((i) => !existing.has(i.id))
      .map((i) => ({ mediaId: i.id, url: i.url }));
    const combined = [...form.gallery, ...fresh].slice(0, MAX_GALLERY);
    updateForm({ gallery: combined });
  };

  const moveGallery = (i: number, dir: -1 | 1) => {
    const next = [...form.gallery];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    updateForm({ gallery: next });
  };

  const removeGallery = (i: number) => {
    updateForm({ gallery: form.gallery.filter((_, j) => j !== i) });
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-display font-bold text-foreground">Content & media</h2>
        <p className="text-sm text-muted-foreground">Een goede foto verdubbelt je bereik. Voeg ook een uitgebreide beschrijving en eventuele sponsors toe.</p>
      </div>

      {/* Full description */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Uitgebreide beschrijving</Label>
          <AiFieldActions
            fieldName="uitgebreide beschrijving"
            currentText={form.fullDescription}
            onResult={(text) => updateForm({ fullDescription: text })}
            eventContext={eventContext}
          />
        </div>
        <Textarea
          value={form.fullDescription}
          onChange={(e) => updateForm({ fullDescription: e.target.value })}
          placeholder="Uitgebreide beschrijving voor de evenementpagina. Vertel bezoekers wat ze kunnen verwachten..."
          rows={6}
          className="min-h-[120px]"
        />
        <p className="text-[11px] text-muted-foreground">Wordt getoond op de volledige evenementpagina</p>
      </div>

      {/* Featured Image */}
      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium">Uitgelichte afbeelding</Label>
          <p className="text-[11px] text-muted-foreground mt-0.5">Aanbevolen: 16:9 verhouding • min. 1200×675px</p>
        </div>
        {form.featuredImageUrl ? (
          <div className="relative rounded-xl border border-border overflow-hidden bg-secondary/20 max-w-md">
            <div className="aspect-video">
              <img src={form.featuredImageUrl} alt="Featured" className="w-full h-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center gap-3 opacity-0 hover:opacity-100">
              <Button size="sm" variant="secondary" onClick={() => setMediaPickerOpen(true)}>Wijzigen</Button>
              <Button size="sm" variant="destructive" onClick={() => updateForm({ featuredImageId: null, featuredImageUrl: null })}>Verwijderen</Button>
            </div>
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-border rounded-xl p-10 text-center hover:border-primary/50 transition-all cursor-pointer bg-secondary/10 max-w-md"
            onClick={() => setMediaPickerOpen(true)}
          >
            <Image className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">Kies of upload een afbeelding</p>
            <p className="text-xs text-muted-foreground">Uit je bibliotheek, stockfoto's of upload nieuw</p>
          </div>
        )}
      </div>

      {/* Gallery */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Galerij (extra foto's)</Label>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Worden onder de beschrijving getoond. Klikbaar om te vergroten. Max {MAX_GALLERY} foto's.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setGalleryPickerOpen(true)}
            disabled={form.gallery.length >= MAX_GALLERY}
          >
            <Plus className="w-3.5 h-3.5" />
            Foto toevoegen
          </Button>
        </div>

        {form.gallery.length === 0 ? (
          <div
            className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-all bg-secondary/5"
            onClick={() => setGalleryPickerOpen(true)}
          >
            <Image className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Nog geen galerij-foto's. Klik om toe te voegen.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {form.gallery.map((g, i) => (
              <div
                key={g.mediaId}
                className="group relative rounded-lg border border-border overflow-hidden aspect-square bg-secondary/20"
              >
                <img src={g.url} alt={`Galerij ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors" />
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => removeGallery(i)}
                    className="w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:scale-110 transition-transform"
                    aria-label="Verwijderen"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => moveGallery(i, -1)}
                    disabled={i === 0}
                    className="w-6 h-6 rounded bg-background/80 backdrop-blur text-foreground flex items-center justify-center disabled:opacity-30 hover:bg-background"
                    aria-label="Naar links"
                  >
                    <ArrowUp className="w-3 h-3 -rotate-90" />
                  </button>
                  <span className="text-[10px] font-medium text-white drop-shadow">{i + 1}</span>
                  <button
                    type="button"
                    onClick={() => moveGallery(i, 1)}
                    disabled={i === form.gallery.length - 1}
                    className="w-6 h-6 rounded bg-background/80 backdrop-blur text-foreground flex items-center justify-center disabled:opacity-30 hover:bg-background"
                    aria-label="Naar rechts"
                  >
                    <ArrowDown className="w-3 h-3 -rotate-90" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {form.gallery.length >= MAX_GALLERY && (
          <p className="text-[11px] text-muted-foreground">Maximum van {MAX_GALLERY} foto's bereikt.</p>
        )}
      </div>

      {/* Sponsors */}
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Sponsoren & Partners</Label>
          <p className="text-xs text-muted-foreground mt-0.5">Worden getoond op de evenementpagina.</p>
        </div>
        {form.sponsors.map((sp, i) => (
          <div key={i} className="rounded-lg border border-border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Sponsor {i + 1}</span>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => updateForm({ sponsors: form.sponsors.filter((_, j) => j !== i) })}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
            <Input value={sp.name} onChange={(e) => { const u = [...form.sponsors]; u[i] = { ...u[i], name: e.target.value }; updateForm({ sponsors: u }); }} placeholder="Naam sponsor" />
            <div className="grid grid-cols-2 gap-2">
              <Input value={sp.website_url} onChange={(e) => { const u = [...form.sponsors]; u[i] = { ...u[i], website_url: e.target.value }; updateForm({ sponsors: u }); }} placeholder="https://website.nl" />
              <Input value={sp.logo_url} onChange={(e) => { const u = [...form.sponsors]; u[i] = { ...u[i], logo_url: e.target.value }; updateForm({ sponsors: u }); }} placeholder="Logo URL (optioneel)" />
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => updateForm({ sponsors: [...form.sponsors, { name: "", logo_url: "", website_url: "" }] })} className="gap-2">
          <Plus className="w-3.5 h-3.5" />Sponsor toevoegen
        </Button>
      </div>

      {/* Featured Media Picker */}
      <MediaPicker
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelect={handleImageSelect}
        selectedId={form.featuredImageId}
        role="featured"
      />

      {/* Gallery Multi Picker */}
      <MediaPicker
        open={galleryPickerOpen}
        onOpenChange={setGalleryPickerOpen}
        onSelect={() => {}}
        onSelectMulti={handleGalleryAdd}
        role="gallery"
        mode="multi"
      />
    </motion.div>
  );
}
