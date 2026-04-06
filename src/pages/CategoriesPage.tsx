import { Tags, Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { t } from "@/lib/i18n";
import { defaultCategories } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export default function CategoriesPage() {
  const [categories] = useState(defaultCategories);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-foreground">{t.nav.categories}</h1>
        <Button size="sm" className="gap-2 gradient-hero text-primary-foreground border-0 hover:opacity-90">
          <Plus className="w-4 h-4" />Categorie toevoegen
        </Button>
      </div>
      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border shadow-card">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color + "20" }}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{cat.name}</p>
              <p className="text-xs text-muted-foreground">{cat.isDefault ? "Standaard" : "Aangepast"}</p>
            </div>
            <div className="flex gap-1">
              <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
              {!cat.isDefault && <button className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
