import { useState, useRef, useCallback } from "react";
import { Image, Upload, Search, Check, Loader2, ImagePlus, Clock, Star, StarOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { CropHintGuide, RolePresetSwitcher, IMAGE_ROLE_SPECS, type ImageRoleKey } from "@/components/media/CropHintGuide";

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

interface MediaPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (mediaId: string, url: string) => void;
  onSelectMulti?: (items: { id: string; url: string }[]) => void;
  selectedId?: string | null;
  role?: ImageRoleKey;
  mode?: "single" | "multi";
}

export default function MediaPicker({ open, onOpenChange, onSelect, onSelectMulti, selectedId, role = "featured", mode = "single" }: MediaPickerProps) {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<string>("library");
  const [search, setSearch] = useState("");
  const [stockQuery, setStockQuery] = useState("");
  const [stockResults, setStockResults] = useState<StockImage[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [multiSelected, setMultiSelected] = useState<{ id: string; url: string }[]>([]);
  const [activeRole, setActiveRole] = useState<ImageRoleKey>(role);

  const roleInfo = IMAGE_ROLE_SPECS[activeRole];

  const { data: mediaItems = [], isLoading: mediaLoading } = useQuery({
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
    enabled: !!tenantId && open,
  });

  const favoriteItems = mediaItems.filter((m) => m.is_favorite);
  const recentItems = [...mediaItems]
    .sort((a, b) => {
      const aTime = a.last_used_at ? new Date(a.last_used_at).getTime() : 0;
      const bTime = b.last_used_at ? new Date(b.last_used_at).getTime() : 0;
      return bTime - aTime;
    })
    .filter((m) => m.last_used_at)
    .slice(0, 8);
  const fallbackRecent = recentItems.length === 0 ? mediaItems.slice(0, 8) : recentItems;
  const filteredItems = mediaItems.filter((m) =>
    m.filename.toLowerCase().includes(search.toLowerCase()) ||
    (m.alt_text || "").toLowerCase().includes(search.toLowerCase())
  );

  const toggleFavorite = async (e: React.MouseEvent, item: Tables<"media">) => {
    e.stopPropagation();
    const { error } = await supabase
      .from("media")
      .update({ is_favorite: !item.is_favorite })
      .eq("id", item.id);
    if (error) {
      toast.error("Kon favoriet niet bijwerken");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["media", tenantId] });
    toast.success(item.is_favorite ? "Verwijderd uit favorieten" : "Toegevoegd aan favorieten");
  };

  const markAsUsed = async (id: string) => {
    await supabase.from("media").update({ last_used_at: new Date().toISOString() }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["media", tenantId] });
  };

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || !tenantId) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${tenantId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("media").upload(path, file);
      if (uploadError) { toast.error(`Upload mislukt: ${file.name}`); continue; }
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
      const { data: row } = await supabase.from("media").insert({
        tenant_id: tenantId,
        filename: file.name,
        storage_path: path,
        original_url: urlData.publicUrl,
        mime_type: file.type,
        file_size: file.size,
        source: "upload" as const,
      }).select("id").single();
      if (row) {
        queryClient.invalidateQueries({ queryKey: ["media", tenantId] });
        onSelect(row.id, urlData.publicUrl);
        onOpenChange(false);
        toast.success("Afbeelding geüpload");
        setUploading(false);
        return;
      }
    }
    setUploading(false);
    queryClient.invalidateQueries({ queryKey: ["media", tenantId] });
  }, [tenantId, queryClient, onSelect, onOpenChange]);

  const handleStockSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!stockQuery.trim()) return;
    setStockLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-stock-images", {
        body: { query: stockQuery.trim(), page: 1, perPage: 24 },
      });
      if (error) throw error;
      setStockResults(data?.results || []);
      if ((data?.results || []).length === 0) toast.info("Geen resultaten. Probeer andere zoekwoorden.");
    } catch {
      toast.error("Zoeken mislukt");
    } finally {
      setStockLoading(false);
    }
  };

  const handleStockSelect = async (img: StockImage) => {
    if (!tenantId) return;
    setSaving(img.id);
    try {
      const res = await fetch(img.downloadUrl);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const ext = img.downloadUrl.includes(".png") ? "png" : "jpg";
      const filename = `${img.source}-${img.id.split("-").pop()}.${ext}`;
      const storagePath = `${tenantId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("media").upload(storagePath, blob, { contentType: blob.type || `image/${ext}` });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("media").getPublicUrl(storagePath);
      const { data: mediaRow, error: insertError } = await supabase.from("media").insert({
        tenant_id: tenantId,
        filename,
        storage_path: storagePath,
        original_url: urlData.publicUrl,
        mime_type: `image/${ext}`,
        width: img.width,
        height: img.height,
        alt_text: img.alt,
        source: "stock" as const,
      }).select("id").single();
      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ["media", tenantId] });
      toast.success(`Afbeelding van ${img.source === "unsplash" ? "Unsplash" : "Pexels"} toegevoegd`);
      onSelect(mediaRow!.id, urlData.publicUrl);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(`Opslaan mislukt: ${err.message || "Onbekende fout"}`);
    } finally {
      setSaving(null);
    }
  };

  const selectExisting = (item: Tables<"media">) => {
    if (mode === "multi") {
      const url = item.original_url || "";
      setMultiSelected((prev) => {
        const exists = prev.find((p) => p.id === item.id);
        if (exists) return prev.filter((p) => p.id !== item.id);
        return [...prev, { id: item.id, url }];
      });
      return;
    }
      onSelect(item.id, item.original_url || "");
      markAsUsed(item.id);
    onOpenChange(false);
  };

  const confirmMulti = () => {
    if (multiSelected.length === 0) return;
    onSelectMulti?.(multiSelected);
    multiSelected.forEach((m) => markAsUsed(m.id));
    setMultiSelected([]);
    onOpenChange(false);
  };

  const isMultiSelected = (id: string) => multiSelected.some((m) => m.id === id);

  const MediaGrid = ({ items }: { items: Tables<"media">[] }) => (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {items.map((item) => {
        const isSelected = mode === "multi" ? isMultiSelected(item.id) : selectedId === item.id;
        return (
          <button
            key={item.id}
            onClick={() => selectExisting(item)}
            className={`group relative rounded-lg border-2 overflow-hidden aspect-square transition-all ${
              isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
            }`}
          >
            <img src={item.original_url || ""} alt={item.alt_text || item.filename}
              className="w-full h-full object-cover" loading="lazy" />
            {isSelected && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <Check className="w-6 h-6 text-primary" />
              </div>
            )}
            <button
              type="button"
              onClick={(e) => toggleFavorite(e, item)}
              className="absolute top-1 left-1 p-1 rounded-md bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-black/60 transition-all"
              aria-label={item.is_favorite ? "Verwijder uit favorieten" : "Voeg toe aan favorieten"}
            >
              {item.is_favorite ? (
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              ) : (
                <StarOff className="w-3 h-3 text-white" />
              )}
            </button>
            {item.is_favorite && (
              <div className="absolute top-1 left-1 p-1 rounded-md bg-black/40 backdrop-blur-sm group-hover:opacity-0 transition-opacity">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[9px] text-white truncate">{item.filename}</p>
            </div>
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Badge variant="secondary" className="text-[8px] h-4 bg-black/50 text-white border-0">
                {item.source === "stock" ? "Stock" : "Upload"}
              </Badge>
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[100dvh] sm:max-h-[85vh] h-[100dvh] sm:h-auto flex flex-col gap-0 p-4 sm:p-6 rounded-none sm:rounded-lg">
        <DialogHeader className="pb-3 space-y-2">
          <DialogTitle className="text-base sm:text-lg font-display">Afbeelding kiezen</DialogTitle>
          <div className="flex items-start sm:items-center justify-between gap-2 flex-col sm:flex-row">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px]">
                {roleInfo.label}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {roleInfo.ratio} • min. {roleInfo.minWidth}×{roleInfo.minHeight}px
              </span>
            </div>
            <RolePresetSwitcher activeRole={activeRole} onChange={setActiveRole} />
          </div>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full grid grid-cols-3 mb-3">
            <TabsTrigger value="library" className="text-[11px] sm:text-xs gap-1 sm:gap-1.5">
              <Image className="w-3.5 h-3.5" /><span className="hidden xs:inline">Bibliotheek</span><span className="xs:hidden">Mijn</span>
            </TabsTrigger>
            <TabsTrigger value="stock" className="text-[11px] sm:text-xs gap-1 sm:gap-1.5">
              <ImagePlus className="w-3.5 h-3.5" /><span className="hidden xs:inline">Stockfoto's</span><span className="xs:hidden">Stock</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="text-[11px] sm:text-xs gap-1 sm:gap-1.5">
              <Upload className="w-3.5 h-3.5" />Upload
            </TabsTrigger>
          </TabsList>

          {/* Library tab */}
          <TabsContent value="library" className="flex-1 overflow-y-auto min-h-0 space-y-4 mt-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Zoek in je mediabibliotheek..."
                className="pl-9 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {!search && favoriteItems.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />Favorieten
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5">
                  {favoriteItems.slice(0, 8).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => selectExisting(item)}
                      className={`relative rounded-md border-2 overflow-hidden aspect-square transition-all ${
                        selectedId === item.id ? "border-primary" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <img src={item.original_url || ""} alt={item.alt_text || item.filename}
                        className="w-full h-full object-cover" loading="lazy" />
                      {selectedId === item.id && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!search && fallbackRecent.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />Recent gebruikt
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5">
                  {fallbackRecent.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => selectExisting(item)}
                      className={`relative rounded-md border-2 overflow-hidden aspect-square transition-all ${
                        selectedId === item.id ? "border-primary" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <img src={item.original_url || ""} alt={item.alt_text || item.filename}
                        className="w-full h-full object-cover" loading="lazy" />
                      {selectedId === item.id && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mediaLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Image className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{search ? "Geen resultaten" : "Nog geen media"}</p>
                <p className="text-xs mt-1">Upload een afbeelding of zoek in stockfoto's</p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Alle media ({filteredItems.length})
                </p>
                <MediaGrid items={filteredItems} />
              </div>
            )}
          </TabsContent>

          {/* Stock photos tab */}
          <TabsContent value="stock" className="flex-1 overflow-y-auto min-h-0 space-y-3 mt-0">
            <form onSubmit={handleStockSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Zoek bijv. 'restaurant', 'live muziek', 'feest'..."
                  className="pl-9 h-9"
                  value={stockQuery}
                  onChange={(e) => setStockQuery(e.target.value)}
                  autoFocus={tab === "stock"}
                />
              </div>
              <Button type="submit" size="sm" disabled={stockLoading || !stockQuery.trim()} className="h-9">
                {stockLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Zoeken"}
              </Button>
            </form>

            {stockResults.length === 0 && !stockLoading ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <ImagePlus className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Zoek gratis stockfoto's van Unsplash & Pexels</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {stockResults.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => handleStockSelect(img)}
                    disabled={saving !== null}
                    className="group relative rounded-lg overflow-hidden border border-border hover:border-primary transition-all aspect-[4/3]"
                  >
                    <img src={img.thumb} alt={img.alt} className="w-full h-full object-cover" loading="lazy" />
                    {saving === img.id && (
                      <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[10px] text-white truncate">
                        📷 {img.photographer} • {img.source === "unsplash" ? "Unsplash" : "Pexels"}
                      </p>
                      <p className="text-[9px] text-white/60">{img.width}×{img.height}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground text-center pt-1">
              Gratis voor commercieel gebruik via Unsplash & Pexels
            </p>
          </TabsContent>

          {/* Upload tab */}
          <TabsContent value="upload" className="flex-1 min-h-0 mt-0">
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => handleUpload(e.target.files)} />
            <div
              className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-all cursor-pointer bg-secondary/10"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                  <p className="text-sm font-medium text-foreground">Uploaden...</p>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">
                    Klik om een afbeelding te uploaden
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Of sleep een bestand hierheen
                  </p>
                  <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">JPG, PNG, WebP</Badge>
                    <Badge variant="outline" className="text-[10px]">Max 10MB</Badge>
                  </div>
                </>
              )}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-secondary/30 border border-border">
              <p className="text-xs font-medium text-foreground mb-1">💡 Tips voor {roleInfo.label}</p>
              <ul className="text-[11px] text-muted-foreground space-y-0.5">
                <li>• Aanbevolen verhouding: <strong>{roleInfo.ratio}</strong></li>
                <li>• Minimaal: <strong>{roleInfo.minWidth}×{roleInfo.minHeight}px</strong></li>
                <li>• Gebruik hoge kwaliteit voor de beste weergave</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        {mode === "multi" && (
          <div className="flex items-center justify-between border-t border-border pt-3 mt-2">
            <p className="text-xs text-muted-foreground">
              {multiSelected.length} foto{multiSelected.length === 1 ? "" : "'s"} geselecteerd
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setMultiSelected([]); onOpenChange(false); }}>
                Annuleren
              </Button>
              <Button size="sm" onClick={confirmMulti} disabled={multiSelected.length === 0}>
                Toevoegen ({multiSelected.length})
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
