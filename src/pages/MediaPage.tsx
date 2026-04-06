import { Image, Upload, Link as LinkIcon, Search, Trash2, X } from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export default function MediaPage() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlFilename, setUrlFilename] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: mediaItems = [], isLoading } = useQuery({
    queryKey: ["media", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data } = await supabase
        .from("media")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
      return (data ?? []) as Tables<"media">[];
    },
    enabled: !!tenantId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: Tables<"media">) => {
      // Delete from storage if uploaded
      if (item.storage_path) {
        await supabase.storage.from("media").remove([item.storage_path]);
      }
      const { error } = await supabase.from("media").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media", tenantId] });
      toast.success("Bestand verwijderd");
    },
    onError: () => toast.error("Verwijderen mislukt"),
  });

  async function handleFileUpload(files: FileList | null) {
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
    queryClient.invalidateQueries({ queryKey: ["media", tenantId] });
    toast.success("Upload voltooid");
  }

  async function handleUrlAdd() {
    if (!urlInput || !tenantId) return;
    const filename = urlFilename || urlInput.split("/").pop() || "afbeelding";
    await supabase.from("media").insert({
      tenant_id: tenantId,
      filename,
      original_url: urlInput,
      source: "url" as const,
    });
    queryClient.invalidateQueries({ queryKey: ["media", tenantId] });
    setUrlDialogOpen(false);
    setUrlInput("");
    setUrlFilename("");
    toast.success("Afbeelding via URL toegevoegd");
  }

  const filtered = mediaItems.filter((m) =>
    m.filename.toLowerCase().includes(search.toLowerCase())
  );

  function getImageUrl(item: Tables<"media">) {
    return item.original_url || "";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Media</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Beheer afbeeldingen voor je evenementen</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setUrlDialogOpen(true)}>
            <LinkIcon className="w-4 h-4" />Via URL
          </Button>
          <Button size="sm" className="gap-2 gradient-hero text-primary-foreground border-0 hover:opacity-90"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4" />{uploading ? "Bezig..." : "Uploaden"}
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)} />
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Zoek in media..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Laden...</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Image}
          title="Nog geen media"
          description="Upload afbeeldingen voor je evenementen. Ze worden automatisch beschikbaar in het formulier."
          actionLabel="Eerste afbeelding uploaden"
          onAction={() => fileInputRef.current?.click()}
          secondaryLabel="Via URL toevoegen"
          onSecondaryAction={() => setUrlDialogOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((item) => (
            <div key={item.id} className="group relative rounded-xl border border-border bg-card overflow-hidden aspect-square">
              <img
                src={getImageUrl(item)}
                alt={item.alt_text || item.filename}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-white truncate">{item.filename}</p>
              </div>
              <button
                onClick={() => deleteMutation.mutate(item)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive/80 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* URL Dialog */}
      <Dialog open={urlDialogOpen} onOpenChange={setUrlDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Afbeelding via URL toevoegen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Afbeelding URL</Label>
              <Input placeholder="https://voorbeeld.nl/afbeelding.jpg" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Bestandsnaam (optioneel)</Label>
              <Input placeholder="mijn-afbeelding.jpg" value={urlFilename} onChange={(e) => setUrlFilename(e.target.value)} />
            </div>
            {urlInput && (
              <div className="rounded-lg border border-border overflow-hidden aspect-video">
                <img src={urlInput} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setUrlDialogOpen(false)}>Annuleren</Button>
              <Button onClick={handleUrlAdd} disabled={!urlInput}>Toevoegen</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
