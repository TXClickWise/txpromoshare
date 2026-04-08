import { useRef } from "react";
import { Image, Upload, Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import type { EventFormState } from "./useEventForm";
import type { Tables } from "@/integrations/supabase/types";

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
}

export function StepMedia({
  form, updateForm,
  mediaPickerOpen, setMediaPickerOpen,
  mediaItems, mediaLoading, uploading,
  fileInputRef, openMediaPicker, handleMediaUpload,
}: StepMediaProps) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-display font-bold text-foreground">Afbeelding & sponsors</h2>
        <p className="text-sm text-muted-foreground">Voeg een uitgelichte afbeelding toe en eventuele sponsors.</p>
      </div>

      {/* Featured Image */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Uitgelichte afbeelding</Label>
        {form.featuredImageUrl ? (
          <div className="relative rounded-xl border border-border overflow-hidden bg-secondary/20 max-w-md">
            <div className="aspect-video">
              <img src={form.featuredImageUrl} alt="Featured" className="w-full h-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center gap-3 opacity-0 hover:opacity-100">
              <Button size="sm" variant="secondary" onClick={openMediaPicker}>Wijzigen</Button>
              <Button size="sm" variant="destructive" onClick={() => updateForm({ featuredImageId: null, featuredImageUrl: null })}>Verwijderen</Button>
            </div>
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-all cursor-pointer bg-secondary/10 max-w-md"
            onClick={openMediaPicker}
          >
            <Image className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">Kies of upload een afbeelding</p>
            <p className="text-xs text-muted-foreground">Klik om je mediabibliotheek te openen</p>
          </div>
        )}
      </div>

      {/* Sponsors */}
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Sponsoren & Partners</Label>
          <p className="text-xs text-muted-foreground mt-0.5">Voeg sponsors toe die op de evenementpagina worden getoond.</p>
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

      {/* Media Picker Dialog */}
      <Dialog open={mediaPickerOpen} onOpenChange={setMediaPickerOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kies een afbeelding</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mb-4">
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleMediaUpload(e.target.files)} />
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
                    updateForm({ featuredImageId: item.id, featuredImageUrl: item.original_url });
                    setMediaPickerOpen(false);
                  }}
                  className={`relative rounded-lg border-2 overflow-hidden aspect-square transition-colors ${form.featuredImageId === item.id ? "border-primary" : "border-border hover:border-primary/50"}`}
                >
                  <img src={item.original_url || ""} alt={item.alt_text || item.filename} className="w-full h-full object-cover" />
                  {form.featuredImageId === item.id && (
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
    </motion.div>
  );
}
