import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, Eye, Send, Sparkles, Clock, MapPin, CalendarDays, Image, Share2, Search as SearchIcon, Repeat, CalendarClock } from "lucide-react";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const categories = Object.entries(t.events.categories);

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const template = searchParams.get("template");
  const [title, setTitle] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);

  const handlePublish = () => {
    toast.success("Evenement gepubliceerd! 🎉", { description: "Je kunt het nu verspreiden via het Distributie Centrum." });
  };

  const handleSave = () => {
    toast.success("Concept opgeslagen");
  };

  return (
    <div className="max-w-4xl">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 border-b border-border mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-display font-bold text-foreground truncate">
              {title || t.events.create}
            </h1>
            {template && <p className="text-xs text-accent font-medium">Sjabloon: {t.events.categories[template as keyof typeof t.events.categories] || template}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 hidden sm:inline-flex">
              <Eye className="w-4 h-4" />{t.common.preview}
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{t.common.save}</span>
            </Button>
            <Button size="sm" onClick={handlePublish} className="gap-2 gradient-hero text-primary-foreground border-0 hover:opacity-90">
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{t.common.publish}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="details">
            <TabsList className="mb-6 w-full justify-start">
              <TabsTrigger value="details" className="gap-1.5"><CalendarDays className="w-3.5 h-3.5" />Details</TabsTrigger>
              <TabsTrigger value="media" className="gap-1.5"><Image className="w-3.5 h-3.5" />Media</TabsTrigger>
              <TabsTrigger value="seo" className="gap-1.5"><Share2 className="w-3.5 h-3.5" />SEO & Delen</TabsTrigger>
              <TabsTrigger value="advanced" className="gap-1.5"><Sparkles className="w-3.5 h-3.5" />Geavanceerd</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-5">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                {/* Title - hero-sized input */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.title} *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Bijv. Live Jazz Avond"
                    className="text-lg font-display font-semibold h-12 border-primary/20 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.subtitle}</Label>
                  <Input placeholder="Optionele ondertitel, bijv. 'Met het Amsterdam Jazz Quartet'" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.category}</Label>
                    <Select defaultValue={template || undefined}>
                      <SelectTrigger><SelectValue placeholder="Kies categorie" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.organizer}</Label>
                    <Input placeholder="Bijv. Café De Kroeg" defaultValue="Café De Kroeg" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.shortDescription}</Label>
                  <Textarea placeholder="Korte beschrijving voor overzichten (max 160 tekens)" rows={2} maxLength={160} />
                  <p className="text-[11px] text-muted-foreground">Wordt getoond in agenda-overzichten en social media previews</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.fullDescription}</Label>
                  <Textarea placeholder="Volledige beschrijving van het evenement. Beschrijf wat bezoekers kunnen verwachten..." rows={5} />
                </div>

                {/* Date/time section */}
                <div className="rounded-xl bg-secondary/30 border border-border p-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    Datum & tijd
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t.events.fields.startDate} *</Label>
                      <Input type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t.events.fields.endDate}</Label>
                      <Input type="date" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t.events.fields.startTime} *</Label>
                      <Input type="time" defaultValue="20:00" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t.events.fields.endTime}</Label>
                      <Input type="time" defaultValue="23:00" />
                    </div>
                  </div>
                </div>

                {/* Location section */}
                <div className="rounded-xl bg-secondary/30 border border-border p-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    Locatie
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t.events.fields.venue}</Label>
                      <Input placeholder="Bijv. Café De Kroeg" defaultValue="Café De Kroeg" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t.events.fields.address}</Label>
                      <Input placeholder="Bijv. Kerkstraat 12, Amsterdam" />
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.ctaButton}</Label>
                    <Input placeholder="Bijv. Reserveer nu" defaultValue="Reserveer nu" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.ctaLink}</Label>
                    <Input placeholder="https://..." />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.tags}</Label>
                  <Input placeholder="Tags gescheiden door komma's, bijv. jazz, live muziek" />
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="media" className="space-y-5">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.featuredImage}</Label>
                  <div className="border-2 border-dashed border-border rounded-xl p-10 text-center hover:border-primary/50 transition-colors cursor-pointer bg-secondary/20">
                    <Image className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground mb-1">Sleep een afbeelding hierheen</p>
                    <p className="text-xs text-muted-foreground">of klik om te uploaden · JPG, PNG tot 5MB</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.gallery}</Label>
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-secondary/20">
                    <p className="text-sm text-muted-foreground">Voeg meerdere afbeeldingen toe voor de galerij</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.sponsors}</Label>
                  <Input placeholder="Sponsor namen (komma-gescheiden)" />
                  <p className="text-[11px] text-muted-foreground">Sponsors worden getoond op de publieke eventpagina</p>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-5">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <div className="rounded-xl bg-secondary/30 border border-border p-4 mb-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    SEO en deelteksten worden automatisch ingevuld op basis van je eventinformatie. Je kunt ze hier aanpassen.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.seoTitle}</Label>
                  <Input placeholder="SEO titel (max 60 tekens)" maxLength={60} defaultValue={title} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.seoDescription}</Label>
                  <Textarea placeholder="SEO beschrijving (max 160 tekens)" rows={3} maxLength={160} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.slug}</Label>
                  <div className="flex items-center gap-0">
                    <span className="text-xs text-muted-foreground bg-secondary px-3 py-2.5 rounded-l-lg border border-r-0 border-border">txpromoshare.nl/e/</span>
                    <Input placeholder="live-jazz-avond" className="rounded-l-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.whatsappShareText}</Label>
                  <Textarea placeholder="Tekst voor WhatsApp delen" rows={3} />
                  <p className="text-[11px] text-muted-foreground">Wordt voorgevuld met evenementnaam, datum en link</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.events.fields.socialShareText}</Label>
                  <Textarea placeholder="Tekst voor social media" rows={3} />
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-5">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                {/* Recurring */}
                <div className="rounded-xl bg-card border border-border p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg gradient-accent flex items-center justify-center">
                        <Repeat className="w-4 h-4 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Terugkerend evenement</p>
                        <p className="text-xs text-muted-foreground">Automatisch herhalend op een vast schema</p>
                      </div>
                    </div>
                    <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                  </div>
                  {isRecurring && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="space-y-3 pt-3 border-t border-border">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Frequentie</Label>
                          <Select defaultValue="weekly">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Dagelijks</SelectItem>
                              <SelectItem value="weekly">Wekelijks</SelectItem>
                              <SelectItem value="biweekly">Tweewekelijks</SelectItem>
                              <SelectItem value="monthly">Maandelijks</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Eindigt na</Label>
                          <Input type="number" placeholder="bijv. 12" defaultValue="12" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Scheduled publish */}
                <div className="rounded-xl bg-card border border-border p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg gradient-hero flex items-center justify-center">
                      <CalendarClock className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Ingepland publiceren</p>
                      <p className="text-xs text-muted-foreground">Plan wanneer dit evenement automatisch live gaat</p>
                    </div>
                  </div>
                  <Input type="datetime-local" className="max-w-xs" />
                </div>

                {/* Ticketing teaser */}
                <div className="rounded-xl border border-dashed border-border p-5 opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                      <span className="text-lg">🎟️</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground flex items-center gap-2">
                        Ticketing
                        <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t.common.futureModule}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">Verkoop tickets via Mollie of Stripe. Binnenkort beschikbaar.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Live preview card */}
        <div className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            <div className="rounded-xl bg-card border border-border shadow-card overflow-hidden">
              <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary flex items-center justify-center">
                <Image className="w-8 h-8 text-muted-foreground/30" />
              </div>
              <div className="p-4">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Preview</p>
                <h3 className="font-display font-bold text-foreground text-sm mb-1">{title || "Evenementnaam"}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Clock className="w-3 h-3" />
                  <span>Datum & tijd</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>Locatie</span>
                </div>
              </div>
              <div className="px-4 pb-4">
                <div className="w-full py-2 rounded-lg gradient-hero text-primary-foreground text-xs font-semibold text-center">
                  Reserveer nu
                </div>
              </div>
            </div>

            {/* Tips sidebar */}
            <div className="rounded-xl bg-secondary/30 border border-border p-4">
              <p className="text-xs font-medium text-foreground mb-2">💡 Tips</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>• Gebruik een pakkende titel van max 50 tekens</li>
                <li>• Voeg altijd een uitgelichte afbeelding toe</li>
                <li>• Vul de korte beschrijving in voor betere previews</li>
                <li>• Stel een CTA in als je reserveringen wilt</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
