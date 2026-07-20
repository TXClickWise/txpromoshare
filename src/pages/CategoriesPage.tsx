import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical, Check, X } from "lucide-react";
import { logAudit } from "@/lib/audit";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useUILanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { ContentSettingsTabs } from "@/components/ContentSettingsTabs";

export default function CategoriesPage() {
  const { t } = useTranslation();
  const { tenantId } = useTenant();
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3B82F6");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        setCategories(data || []);
        setLoading(false);
      });
  }, []);

  const overigCat = categories.find(c => c.slug === "overig");
  const sortable = categories.filter(c => c.slug !== "overig");

  function handleDragStart(idx: number) { setDragIdx(idx); }
  function handleDragOver(e: React.DragEvent, idx: number) { e.preventDefault(); setOverIdx(idx); }

  function handleDragEnd() {
    if (dragIdx === null || overIdx === null || dragIdx === overIdx) {
      setDragIdx(null); setOverIdx(null); return;
    }
    const updated = [...sortable];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(overIdx, 0, moved);
    const reordered = updated.map((c, i) => ({ ...c, sort_order: i }));
    const full = overigCat ? [...reordered, { ...overigCat, sort_order: reordered.length }] : reordered;
    setCategories(full);
    setDragIdx(null); setOverIdx(null);
    persistOrder(full);
  }

  async function persistOrder(list: Tables<"categories">[]) {
    const updates = list.map((c, i) =>
      supabase.from("categories").update({ sort_order: i }).eq("id", c.id)
    );
    await Promise.all(updates);
  }

  async function addCategory() {
    if (!newName.trim() || !tenantId) return;
    const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const insertOrder = sortable.length;
    const { data, error } = await supabase.from("categories").insert({
      name: newName, slug, color: newColor, tenant_id: tenantId, sort_order: insertOrder,
    }).select().single();
    if (error) {
      toast.error(`${t("categories.addFailed")}: ${error.message}`);
    } else {
      const newList = [...sortable, data].map((c, i) => ({ ...c, sort_order: i }));
      const full = overigCat ? [...newList, { ...overigCat, sort_order: newList.length }] : newList;
      setCategories(full);
      setNewName("");
      setAdding(false);
      toast.success(t("categories.added"));
      persistOrder(full);
      if (tenantId) logAudit({ tenantId, entityType: "category", action: "created", entityId: data.id, metadata: { name: newName } });
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm(t("categories.confirmDelete"))) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast.error(`${t("categories.deleteFailed")}: ${error.message}`);
    } else {
      const cat = categories.find(c => c.id === id);
      const remaining = categories.filter(c => c.id !== id);
      setCategories(remaining);
      toast.success(t("categories.deleted"));
      if (tenantId) logAudit({ tenantId, entityType: "category", action: "deleted", entityId: id, metadata: { name: cat?.name } });
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <ContentSettingsTabs active="categorieen" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t("categories.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("categories.subtitle")}</p>
        </div>
        <Button size="sm" onClick={() => setAdding(true)} className="gap-2 gradient-hero text-primary-foreground border-0 hover:opacity-90">
          <Plus className="w-4 h-4" />{t("categories.add")}
        </Button>
      </div>

      <div className="rounded-xl bg-secondary/30 border border-border p-3">
        <p className="text-xs text-muted-foreground">{t("categories.helpTip")}</p>
      </div>

      {adding && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-primary/20 shadow-card">
          <Input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="w-10 h-10 p-1 cursor-pointer shrink-0" />
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t("categories.namePlaceholder")} className="flex-1" autoFocus onKeyDown={(e) => e.key === "Enter" && addCategory()} />
          <Button size="sm" onClick={addCategory} className="gap-1"><Check className="w-4 h-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)}><X className="w-4 h-4" /></Button>
        </div>
      )}

      <div className="space-y-2">
        {sortable.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-3 p-4 rounded-xl bg-card border shadow-card hover:shadow-elevated transition-all ${
              dragIdx === i ? "opacity-50 scale-95 border-primary" : overIdx === i && dragIdx !== null ? "border-primary/50 bg-primary/5" : "border-border"
            }`}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab active:cursor-grabbing shrink-0" />
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: (cat.color || "#6B7280") + "20" }}>
              <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: cat.color || "#6B7280" }} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground text-sm">{cat.name}</p>
              <p className="text-xs text-muted-foreground">{cat.is_default ? t("categories.isDefault") : t("categories.isCustom")}</p>
            </div>
            <div className="flex gap-1">
              {!cat.is_default && (
                <button onClick={() => deleteCategory(cat.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        ))}

        {overigCat && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 shadow-card opacity-70">
            <div className="w-4 h-4 shrink-0" />
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: (overigCat.color || "#6B7280") + "20" }}>
              <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: overigCat.color || "#6B7280" }} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground text-sm">{overigCat.name}</p>
              <p className="text-xs text-muted-foreground">{t("categories.defaultPinned")}</p>
            </div>
          </div>
        )}
      </div>

      <UpgradeBanner feature={t("categories.upgradeFeature")} plan="Basic" compact />
    </div>
  );
}
