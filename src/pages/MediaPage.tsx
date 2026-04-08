import { Image, Upload, Search, Trash2, ImagePlus, Copy, Check, Grid3x3, List, Eye, FileType, HardDrive } from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";
import StockImageSearch from "@/components/StockImageSearch";

type ViewMode = "grid" | "list";
type SourceFilter = "all" | "upload" | "stock" | "url";

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPage() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<Tables<"media"> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    mutationFn: async (items: Tables<"media">[]) => {
      for (const item of items) {
        if (item.storage_path) {
          await supabase.storage.from("media").remove([item.storage_path]);
        }
        await supabase.from("media").delete().eq("id", item.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media", tenantId] });
      setSelectedIds(new Set());
      toast.success("Verwijderd");
    },
    onError: () => toast.error("Verwijderen mislukt"),
  });

  async function handleFileUpload(files: FileList | null) {
    if (!files || !tenantId) return;
    setUploading(true);
    let count = 0;
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
      count++;
    }
    setUploading(false);
    queryClient.invalidateQueries({ queryKey: ["media", tenantId] });
    toast.success(`${count} bestand${count > 1 ? "en" : ""} geüpload`);
  }

  const filtered = mediaItems.filter((m) => {
    const matchesSearch = m.filename.toLowerCase().includes(search.toLowerCase()) ||
      (m.alt_text || "").toLowerCase().includes(search.toLowerCase());
    const matchesSource = sourceFilter === "all" || m.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const totalSize = mediaItems.reduce((sum, m) => sum + (m.file_size || 0), 0);

  function getImageUrl(item: Tables<"media">) {
    return item.original_url || "";
  }

  const copyUrl = (item: Tables<"media">) => {
    navigator.clipboard.writeText(getImageUrl(item));
    setCopiedId(item.id);
    toast.success("URL gekopieerd");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleBulkDelete = () => {
    const items = mediaItems.filter((m) => selectedIds.has(m.id));
    if (items.length === 0) return;
    if (!confirm(`${items.length} bestand(en) verwijderen?`)) return;
    deleteMutation.mutate(items);
  };

  const sourceCounts = {
    all: mediaItems.length,
    upload: mediaItems.filter((m) => m.source === "upload").length,
    stock: mediaItems.filter((m) => m.source === "stock").length,
    url: mediaItems.filter((m) => m.source === "url").length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Media</h1>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
            <span>{mediaItems.length} bestanden</span>
            <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{formatBytes(totalSize)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setStockDialogOpen(true)}>
            <ImagePlus className="w-4 h-4" />
            <span className="hidden sm:inline">Stockfoto's</span>
          </Button>
          <Button size="sm" className="gap-2" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4" />{uploading ? "Bezig..." : "Uploaden"}
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)} />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Zoek op naam of alt-tekst..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as SourceFilter)}>
          <SelectTrigger className="w-[140px] h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle ({sourceCounts.all})</SelectItem>
            <SelectItem value="upload">Uploads ({sourceCounts.upload})</SelectItem>
            <SelectItem value="stock">Stock ({sourceCounts.stock})</SelectItem>
            <SelectItem value="url">URL ({sourceCounts.url})</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 border border-border rounded-lg p-0.5">
          <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
        {selectedIds.size > 0 && (
          <Button variant="destructive" size="sm" className="gap-2" onClick={handleBulkDelete}>
            <Trash2 className="w-3.5 h-3.5" />{selectedIds.size} verwijderen
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-secondary animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        search || sourceFilter !== "all" ? (
          <div className="p-8 text-center text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Geen resultaten gevonden</p>
          </div>
        ) : (
          <EmptyState
            icon={Image}
            title="Nog geen media"
            description="Upload afbeeldingen voor je evenementen of zoek in gratis stockfoto's."
            actionLabel="Eerste afbeelding uploaden"
            onAction={() => fileInputRef.current?.click()}
            secondaryLabel="Stockfoto's zoeken"
            onSecondaryAction={() => setStockDialogOpen(true)}
          />
        )
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              className="group relative rounded-xl border border-border bg-card overflow-hidden aspect-square cursor-pointer"
              onClick={() => setPreviewItem(item)}
            >
              <img src={getImageUrl(item)} alt={item.alt_text || item.filename}
                className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
              
              {/* Source badge */}
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Badge variant="secondary" className="text-[9px] bg-black/50 text-white border-0 backdrop-blur-sm">
                  {item.source === "stock" ? "Stock" : item.source === "url" ? "URL" : "Upload"}
                </Badge>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-white truncate">{item.filename}</p>
                {item.file_size && <p className="text-[9px] text-white/60">{formatBytes(item.file_size)}</p>}
              </div>

              {/* Actions */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); copyUrl(item); }}
                  className="w-7 h-7 rounded-full bg-white/80 text-foreground flex items-center justify-center hover:bg-white">
                  {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); deleteMutation.mutate([item]); }}
                  className="w-7 h-7 rounded-full bg-destructive/80 text-destructive-foreground flex items-center justify-center hover:bg-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Checkbox */}
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <input type="checkbox" checked={selectedIds.has(item.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    const next = new Set(selectedIds);
                    if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
                    setSelectedIds(next);
                  }}
                  className="w-4 h-4 rounded border-white accent-primary cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* List view */
        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
          {filtered.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors group cursor-pointer"
              onClick={() => setPreviewItem(item)}>
              <img src={getImageUrl(item)} alt={item.alt_text || item.filename}
                className="w-12 h-12 rounded-lg object-cover shrink-0" loading="lazy" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.filename}</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                  <span>{formatBytes(item.file_size)}</span>
                  {item.width && item.height && <span>{item.width}×{item.height}</span>}
                  <Badge variant="outline" className="text-[9px] h-4">{item.source}</Badge>
                </p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); copyUrl(item); }}>
                  {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate([item]); }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display truncate">{previewItem?.filename}</DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border overflow-hidden bg-secondary/30">
                <img src={getImageUrl(previewItem)} alt={previewItem.alt_text || previewItem.filename}
                  className="w-full max-h-[400px] object-contain" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Bestandsnaam</p>
                  <p className="font-medium text-foreground truncate">{previewItem.filename}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Bestandsgrootte</p>
                  <p className="font-medium text-foreground">{formatBytes(previewItem.file_size)}</p>
                </div>
                {previewItem.width && previewItem.height && (
                  <div>
                    <p className="text-muted-foreground">Afmetingen</p>
                    <p className="font-medium text-foreground">{previewItem.width} × {previewItem.height} px</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Bron</p>
                  <p className="font-medium text-foreground capitalize">{previewItem.source}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium text-foreground">{previewItem.mime_type || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Toegevoegd</p>
                  <p className="font-medium text-foreground">{new Date(previewItem.created_at).toLocaleDateString("nl-NL")}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2 flex-1" onClick={() => copyUrl(previewItem)}>
                  <Copy className="w-3.5 h-3.5" />Kopieer URL
                </Button>
                <Button variant="outline" size="sm" className="gap-2 flex-1" asChild>
                  <a href={getImageUrl(previewItem)} target="_blank" rel="noopener noreferrer">
                    <Eye className="w-3.5 h-3.5" />Open origineel
                  </a>
                </Button>
                <Button variant="destructive" size="sm" className="gap-2" onClick={() => { deleteMutation.mutate([previewItem]); setPreviewItem(null); }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <StockImageSearch open={stockDialogOpen} onOpenChange={setStockDialogOpen} />
    </div>
  );
}
