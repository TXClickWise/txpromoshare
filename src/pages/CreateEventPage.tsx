import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { t } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const categories = Object.entries(t.events.categories);

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">{t.events.create}</h1>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Eye className="w-4 h-4" />{t.common.preview}
        </Button>
        <Button size="sm" className="gap-2 gradient-hero text-primary-foreground border-0 hover:opacity-90">
          <Save className="w-4 h-4" />{t.common.save}
        </Button>
      </div>

      <Tabs defaultValue="details">
        <TabsList className="mb-6">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="seo">SEO & Delen</TabsTrigger>
          <TabsTrigger value="advanced">Geavanceerd</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-5">
          <div className="grid gap-5">
            <div className="space-y-2">
              <Label>{t.events.fields.title} *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bijv. Live Jazz Avond" />
            </div>
            <div className="space-y-2">
              <Label>{t.events.fields.subtitle}</Label>
              <Input placeholder="Optionele ondertitel" />
            </div>
            <div className="space-y-2">
              <Label>{t.events.fields.category}</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Kies categorie" /></SelectTrigger>
                <SelectContent>
                  {categories.map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.events.fields.shortDescription}</Label>
              <Textarea placeholder="Korte beschrijving voor overzichten (max 160 tekens)" rows={2} />
            </div>
            <div className="space-y-2">
              <Label>{t.events.fields.fullDescription}</Label>
              <Textarea placeholder="Volledige beschrijving van het evenement" rows={6} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.events.fields.startDate} *</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>{t.events.fields.endDate}</Label>
                <Input type="date" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.events.fields.startTime} *</Label>
                <Input type="time" />
              </div>
              <div className="space-y-2">
                <Label>{t.events.fields.endTime}</Label>
                <Input type="time" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.events.fields.venue}</Label>
              <Input placeholder="Bijv. Café De Kroeg" />
            </div>
            <div className="space-y-2">
              <Label>{t.events.fields.address}</Label>
              <Input placeholder="Bijv. Kerkstraat 12, Amsterdam" />
            </div>
            <div className="space-y-2">
              <Label>{t.events.fields.organizer}</Label>
              <Input placeholder="Naam van de organisator" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.events.fields.ctaButton}</Label>
                <Input placeholder="Bijv. Reserveer nu" />
              </div>
              <div className="space-y-2">
                <Label>{t.events.fields.ctaLink}</Label>
                <Input placeholder="https://..." />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.events.fields.tags}</Label>
              <Input placeholder="Tags gescheiden door komma's" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="media" className="space-y-5">
          <div className="space-y-2">
            <Label>{t.events.fields.featuredImage}</Label>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <p className="text-sm text-muted-foreground">Sleep een afbeelding hierheen of klik om te uploaden</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t.events.fields.gallery}</Label>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <p className="text-sm text-muted-foreground">Voeg meerdere afbeeldingen toe voor de galerij</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t.events.fields.sponsors}</Label>
            <Input placeholder="Sponsor namen (komma-gescheiden)" />
          </div>
        </TabsContent>

        <TabsContent value="seo" className="space-y-5">
          <div className="space-y-2">
            <Label>{t.events.fields.seoTitle}</Label>
            <Input placeholder="SEO titel (max 60 tekens)" />
          </div>
          <div className="space-y-2">
            <Label>{t.events.fields.seoDescription}</Label>
            <Textarea placeholder="SEO beschrijving (max 160 tekens)" rows={3} />
          </div>
          <div className="space-y-2">
            <Label>{t.events.fields.slug}</Label>
            <Input placeholder="live-jazz-avond" />
          </div>
          <div className="space-y-2">
            <Label>{t.events.fields.socialShareText}</Label>
            <Textarea placeholder="Tekst voor social media" rows={3} />
          </div>
          <div className="space-y-2">
            <Label>{t.events.fields.whatsappShareText}</Label>
            <Textarea placeholder="Tekst voor WhatsApp delen" rows={3} />
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-5">
          <div className="p-4 rounded-xl bg-secondary/50 border border-border">
            <p className="text-sm font-medium text-foreground mb-1">Terugkerend evenement</p>
            <p className="text-xs text-muted-foreground">Configureer een herhalend schema voor dit evenement.</p>
          </div>
          <div className="p-4 rounded-xl bg-secondary/50 border border-border">
            <p className="text-sm font-medium text-foreground mb-1">Ingepland publiceren</p>
            <p className="text-xs text-muted-foreground">Plan wanneer dit evenement automatisch gepubliceerd wordt.</p>
            <Input type="datetime-local" className="mt-3 max-w-xs" />
          </div>
          <div className="p-4 rounded-xl border border-dashed border-border opacity-60">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-foreground">🎟️ Ticketing</p>
              <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t.common.futureModule}</span>
            </div>
            <p className="text-xs text-muted-foreground">Verkoop tickets via Mollie of Stripe. Binnenkort beschikbaar als uitbreidingsmodule.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
