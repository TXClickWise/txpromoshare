import { Tags, Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import { defaultCategories } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { UpgradeBanner } from "@/components/UpgradeBanner";

export default function CategoriesPage() {
  const [categories] = useState(defaultCategories);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t.nav.categories}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Organiseer je evenementen met categorieën</p>
        </div>
        <Button size="sm" className="gap-2 gradient-hero text-primary-foreground border-0 hover:opacity-90">
          <Plus className="w-4 h-4" />Categorie toevoegen
        </Button>
      </div>

      <div className="rounded-xl bg-secondary/30 border border-border p-3">
        <p className="text-xs text-muted-foreground">
          💡 Standaard categorieën zijn beschikbaar voor alle organisatoren. Je kunt aangepaste categorieën toevoegen die alleen zichtbaar zijn in jouw workspace.
        </p>
      </div>

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
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: cat.color + "20" }}>
              <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: cat.color }} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground text-sm">{cat.name}</p>
              <p className="text-xs text-muted-foreground">{cat.isDefault ? "Standaard categorie" : "Aangepaste categorie"}</p>
            </div>
            <div className="flex gap-1">
              <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
              {!cat.isDefault && <button className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>}
            </div>
          </motion.div>
        ))}
      </div>

      <UpgradeBanner feature="Eigen categorieën aanmaken" plan="Basic" compact />
    </div>
  );
}
