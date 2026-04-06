import { Image, Upload, Link as LinkIcon, Grid3X3, List, Search } from "lucide-react";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";

export default function MediaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t.nav.media}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Beheer afbeeldingen voor je evenementen</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2"><LinkIcon className="w-4 h-4" />Via URL</Button>
          <Button size="sm" className="gap-2 gradient-hero text-primary-foreground border-0 hover:opacity-90"><Upload className="w-4 h-4" />Uploaden</Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Zoek in media..." className="pl-9" />
      </div>

      <EmptyState
        icon={Image}
        title="Nog geen media"
        description="Upload afbeeldingen voor je evenementen. Ze worden automatisch beschikbaar in het formulier."
        actionLabel="Eerste afbeelding uploaden"
        onAction={() => {}}
        secondaryLabel="Via URL toevoegen"
        secondaryTo="#"
      />
    </div>
  );
}
