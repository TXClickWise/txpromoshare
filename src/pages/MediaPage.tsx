import { Image, Upload, Link as LinkIcon } from "lucide-react";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export default function MediaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-foreground">{t.nav.media}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2"><LinkIcon className="w-4 h-4" />Via URL</Button>
          <Button size="sm" className="gap-2 gradient-hero text-primary-foreground border-0 hover:opacity-90"><Upload className="w-4 h-4" />Uploaden</Button>
        </div>
      </div>
      <div className="border-2 border-dashed border-border rounded-xl p-16 text-center">
        <Image className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="font-display font-semibold text-foreground mb-1">Nog geen media</h3>
        <p className="text-sm text-muted-foreground mb-4">Upload afbeeldingen of voeg ze toe via een URL</p>
        <Button variant="outline" size="sm" className="gap-2"><Upload className="w-4 h-4" />Eerste afbeelding uploaden</Button>
      </div>
    </div>
  );
}
