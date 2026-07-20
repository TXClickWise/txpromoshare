import { useState } from "react";
import { Search, Loader2, ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface StockImage {
  id: string;
  url: string;
  thumb: string;
  width: number;
  height: number;
  alt: string;
  source: "unsplash" | "pexels";
  photographer: string;
  downloadUrl: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageSaved?: (mediaId: string, url: string) => void;
}

export default function StockImageSearch({ open, onOpenChange, onImageSaved }: Props) {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-stock-images", {
        body: { query: query.trim(), page: 1, perPage: 20 },
      });
      if (error) throw error;
      setResults(data?.results || []);
      if ((data?.results || []).length === 0) {
        toast.info("Geen afbeeldingen gevonden. Probeer andere zoekwoorden.");
      }
    } catch {
      toast.error("Zoeken mislukt. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect(img: StockImage) {
    if (!tenantId) return;
    setSaving(img.id);
    try {
      // Download image via edge function proxy to avoid CORS
      const res = await fetch(img.downloadUrl);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();

      const ext = img.downloadUrl.includes(".png") ? "png" : "jpg";
      const filename = `${img.source}-${img.id.split("-").pop()}.${ext}`;
      const storagePath = `${tenantId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(storagePath, blob, { contentType: blob.type || `image/${ext}` });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("media").getPublicUrl(storagePath);

      const { data: mediaRow, error: insertError } = await supabase
        .from("media")
        .insert({
          tenant_id: tenantId,
          filename,
          storage_path: storagePath,
          original_url: urlData.publicUrl,
          mime_type: `image/${ext}`,
          width: img.width,
          height: img.height,
          alt_text: img.alt,
          source: "stock" as const,
        })
        .select("id")
        .single();
      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ["media", tenantId] });
      toast.success(`Afbeelding van ${img.source === "unsplash" ? "Unsplash" : "Pexels"} toegevoegd`);
      onImageSaved?.(mediaRow.id, urlData.publicUrl);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(`Opslaan mislukt: ${err.message || "Onbekende fout"}`);
    } finally {
      setSaving(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Stockfoto zoeken</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Zoek op bijv. 'feest', 'concert', 'restaurant'..."
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <Button type="submit" disabled={loading || !query.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Zoeken"}
          </Button>
        </form>

        <div className="flex-1 overflow-y-auto min-h-0">
          {results.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ImageIcon className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">Zoek naar afbeeldingen op Unsplash & Pexels</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2">
              {results.map((img) => (
                <button
                  key={img.id}
                  onClick={() => handleSelect(img)}
                  disabled={saving !== null}
                  className="group relative rounded-lg overflow-hidden border border-border hover:border-primary transition-colors aspect-square"
                >
                  <img
                    src={img.thumb}
                    alt={img.alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {saving === img.id && (
                    <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white truncate">
                      📷 {img.photographer} • {img.source === "unsplash" ? "Unsplash" : "Pexels"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Foto's via Unsplash & Pexels — gratis voor commercieel gebruik
        </p>
      </DialogContent>
    </Dialog>
  );
}
