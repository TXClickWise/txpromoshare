import { Image, Upload, Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { AiAssistButton } from "@/components/AiAssistButton";
import { useAiAssist } from "@/hooks/useAiAssist";
import MediaPicker from "@/components/MediaPicker";
import type { EventFormState } from "./useEventForm";
import type { Tables } from "@/integrations/supabase/types";
import { useState } from "react";

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
  const { run, loading } = useAiAssist();
  const categoryName = categories.find((c) => c.id === form.category)?.name || "";

  const handleGenerateFullDescription = () => {
    run({
      task: "generate_description",
      context: { title: form.title, category: categoryName, organizer: form.organizer, date: form.startDate, venue: form.venue },
      onResult: (result) => {
        if (result.fullDescription) updateForm({ fullDescription: result.fullDescription });
      },
    });
  };

  const handleImageSelect = (mediaId: string, url: string) => {
    updateForm({ featuredImageId: mediaId, featuredImageUrl: url });
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-display font-bold text-foreground">Content & media</h2>
        <p className="text-sm text-muted-foreground">Voeg een beschrijving, afbeelding en eventuele sponsors toe.</p>
      </div>

      {/* Full description */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Uitgebreide beschrijving</Label>
          {form.title && (
            <AiAssistButton
              onClick={handleGenerateFullDescription}
              loading={loading === "generate_description"}
              label="Genereer"
            />
          )}
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

      {/* Unified Media Picker */}
      <MediaPicker
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelect={handleImageSelect}
        selectedId={form.featuredImageId}
        role="featured"
      />
    </motion.div>
  );
}
