import { Settings, Building2, Palette, Globe } from "lucide-react";
import { t } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-display font-bold text-foreground">{t.nav.settings}</h1>

      {/* Organization */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          <h2 className="font-display font-semibold text-foreground">Organisatie</h2>
        </div>
        <div className="p-5 rounded-xl bg-card border border-border shadow-card space-y-4">
          <div className="space-y-2">
            <Label>Bedrijfsnaam</Label>
            <Input defaultValue="Café De Kroeg" />
          </div>
          <div className="space-y-2">
            <Label>Locatie / Venue</Label>
            <Input defaultValue="Kerkstraat 12, Amsterdam" />
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input defaultValue="https://cafedekroeg.nl" />
          </div>
          <Button size="sm">{t.common.save}</Button>
        </div>
      </section>

      {/* Branding */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" />
          <h2 className="font-display font-semibold text-foreground">Branding</h2>
        </div>
        <div className="p-5 rounded-xl bg-card border border-border shadow-card space-y-4">
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center text-sm text-muted-foreground hover:border-primary/50 cursor-pointer transition-colors">
              Upload je logo
            </div>
          </div>
          <div className="space-y-2">
            <Label>Primaire kleur</Label>
            <div className="flex gap-2 items-center">
              <Input type="color" defaultValue="#E86C2C" className="w-12 h-10 p-1" />
              <Input defaultValue="#E86C2C" className="flex-1" />
            </div>
          </div>
          <Button size="sm">{t.common.save}</Button>
        </div>
      </section>
    </div>
  );
}
