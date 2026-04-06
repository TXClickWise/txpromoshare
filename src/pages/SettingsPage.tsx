import { Building2, Palette, Globe, MapPin, Phone, Mail, Save } from "lucide-react";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-display font-bold text-foreground">{t.nav.settings}</h1>

      <Tabs defaultValue="organization">
        <TabsList className="mb-6">
          <TabsTrigger value="organization" className="gap-1.5"><Building2 className="w-3.5 h-3.5" />Organisatie</TabsTrigger>
          <TabsTrigger value="branding" className="gap-1.5"><Palette className="w-3.5 h-3.5" />Branding</TabsTrigger>
          <TabsTrigger value="venue" className="gap-1.5"><MapPin className="w-3.5 h-3.5" />Locatie</TabsTrigger>
        </TabsList>

        <TabsContent value="organization">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card border border-border shadow-card p-6 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bedrijfsnaam</Label>
                <Input defaultValue="Café De Kroeg" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Website</Label>
                <Input defaultValue="https://cafedekroeg.nl" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Mail className="w-3 h-3" />E-mail</Label>
                <Input defaultValue="info@cafedekroeg.nl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Phone className="w-3 h-3" />Telefoon</Label>
                <Input defaultValue="+31 20 123 4567" />
              </div>
            </div>
            <Button size="sm" onClick={() => toast.success("Instellingen opgeslagen")} className="gap-2">
              <Save className="w-4 h-4" />{t.common.save}
            </Button>
          </motion.div>
        </TabsContent>

        <TabsContent value="branding">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card border border-border shadow-card p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Logo</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 cursor-pointer transition-colors bg-secondary/20">
                <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
                  <Building2 className="w-7 h-7 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium text-foreground">Upload je logo</p>
                <p className="text-xs text-muted-foreground mt-1">PNG of SVG, minimaal 200x200px</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Primaire kleur</Label>
                <div className="flex gap-2 items-center">
                  <Input type="color" defaultValue="#E86C2C" className="w-12 h-10 p-1 cursor-pointer" />
                  <Input defaultValue="#E86C2C" className="flex-1 font-mono text-sm" />
                </div>
                <p className="text-[11px] text-muted-foreground">Wordt gebruikt op eventpagina's en widgets</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Secundaire kleur</Label>
                <div className="flex gap-2 items-center">
                  <Input type="color" defaultValue="#2A9D8F" className="w-12 h-10 p-1 cursor-pointer" />
                  <Input defaultValue="#2A9D8F" className="flex-1 font-mono text-sm" />
                </div>
              </div>
            </div>

            {/* Live preview */}
            <div className="rounded-xl bg-secondary/30 border border-border p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Preview</p>
              <div className="flex gap-3">
                <div className="w-full py-2.5 rounded-lg gradient-hero text-primary-foreground text-xs font-semibold text-center">Reserveer nu</div>
                <div className="w-full py-2.5 rounded-lg gradient-accent text-accent-foreground text-xs font-semibold text-center">Deel event</div>
              </div>
            </div>

            <Button size="sm" onClick={() => toast.success("Branding opgeslagen")} className="gap-2">
              <Save className="w-4 h-4" />{t.common.save}
            </Button>
          </motion.div>
        </TabsContent>

        <TabsContent value="venue">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card border border-border shadow-card p-6 space-y-5">
            <p className="text-xs text-muted-foreground">Je standaard locatie wordt automatisch ingevuld bij nieuwe evenementen.</p>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Locatienaam</Label>
              <Input defaultValue="Café De Kroeg" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Adres</Label>
                <Input defaultValue="Kerkstraat 12" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stad</Label>
                <Input defaultValue="Amsterdam" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Postcode</Label>
              <Input defaultValue="1017 GR" className="max-w-[200px]" />
            </div>
            <Button size="sm" onClick={() => toast.success("Locatie opgeslagen")} className="gap-2">
              <Save className="w-4 h-4" />{t.common.save}
            </Button>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
