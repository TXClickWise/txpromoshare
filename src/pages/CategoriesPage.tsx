import { useState, useEffect } from "react";
import { Tags, Plus, Pencil, Trash2, GripVertical, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export default function CategoriesPage() {
  const { tenantId } = useTenant();
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3B82F6");

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

  async function addCategory() {
    if (!newName.trim() || !tenantId) return;
    const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const { data, error } = await supabase.from("categories").insert({
      name: newName, slug, color: newColor, tenant_id: tenantId, sort_order: categories.length,
    }).select().single();
    if (error) {
      toast.error("Toevoegen mislukt: " + error.message);
    } else {
      setCategories([...categories, data]);
      setNewName("");
      setAdding(false);
      toast.success("Categorie toegevoegd");
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm("Categorie verwijderen?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast.error("Verwijderen mislukt: " + error.message);
    } else {
      setCategories(categories.filter(c => c.id !== id));
      toast.success("Categorie verwijderd");
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t.nav.categories}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Organiseer je evenementen met categorieën</p>
        </div>
        <Button size="sm" onClick={() => setAdding(true)} className="gap-2 gradient-hero text-primary-foreground border-0 hover:opacity-90">
          <Plus className="w-4 h-4" />Categorie toevoegen
        </Button>
      </div>

      <div className="rounded-xl bg-secondary/30 border border-border p-3">
        <p className="text-xs text-muted-foreground">
          💡 Standaard categorieën zijn beschikbaar voor alle organisatoren. Je kunt aangepaste categorieën toevoegen die alleen zichtbaar zijn in jouw workspace.
        </p>
      </div>

      {adding && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-primary/20 shadow-card">
          <Input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="w-10 h-10 p-1 cursor-pointer shrink-0" />
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Categorienaam" className="flex-1" autoFocus onKeyDown={(e) => e.key === "Enter" && addCategory()} />
          <Button size="sm" onClick={addCategory} className="gap-1"><Check className="w-4 h-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)}><X className="w-4 h-4" /></Button>
        </div>
      )}

      <div className="space-y-2">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border shadow-card hover:shadow-elevated transition-shadow"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground/30 cursor-grab shrink-0" />
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: (cat.color || "#6B7280") + "20" }}>
              <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: cat.color || "#6B7280" }} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground text-sm">{cat.name}</p>
              <p className="text-xs text-muted-foreground">{cat.is_default ? "Standaard categorie" : "Aangepaste categorie"}</p>
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
      </div>

      <UpgradeBanner feature="Eigen categorieën aanmaken" plan="Basic" compact />
    </div>
  );
}
