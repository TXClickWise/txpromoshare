import { useState } from "react";
import { Plug, Zap, Check, AlertCircle, ArrowRight, Calendar, RefreshCw, Clock, Send, Users, BarChart3, Settings2, ChevronRight, Link2, Unlink, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ConnectionStatus = "disconnected" | "connected" | "error";

interface SyncRule {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  trigger: string;
}

const defaultSyncRules: SyncRule[] = [
  { id: "event_published", label: "Event gepubliceerd", description: "Stuur eventdata naar ClickWise wanneer een event gepubliceerd wordt", enabled: true, trigger: "event.published" },
  { id: "event_updated", label: "Event gewijzigd", description: "Update gelinkte assets in ClickWise wanneer eventdetails wijzigen", enabled: true, trigger: "event.updated" },
  { id: "event_ended", label: "Event afgelopen", description: "Trigger follow-up workflow wanneer een event eindigt", enabled: false, trigger: "event.ended" },
  { id: "event_reminder", label: "Event herinnering", description: "Stuur herinnering via ClickWise voor aankomende events", enabled: false, trigger: "event.reminder" },
];

interface SyncLog {
  id: string;
  event: string;
  trigger: string;
  status: "success" | "failed" | "pending";
  timestamp: string;
  detail?: string;
}

const mockLogs: SyncLog[] = [
  { id: "1", event: "Live Muziek Vrijdag", trigger: "event.published", status: "success", timestamp: "2 min geleden" },
  { id: "2", event: "Bierproeverij Zomer", trigger: "event.updated", status: "success", timestamp: "1 uur geleden" },
  { id: "3", event: "Quiz Night", trigger: "event.published", status: "failed", timestamp: "3 uur geleden", detail: "ClickWise API timeout" },
];

export default function IntegrationsPage() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [subaccountId, setSubaccountId] = useState("");
  const [syncRules, setSyncRules] = useState(defaultSyncRules);
  const [activeTab, setActiveTab] = useState("overview");

  const toggleRule = (id: string) => {
    setSyncRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const handleConnect = () => setStatus("connected");
  const handleDisconnect = () => { setStatus("disconnected"); setSubaccountId(""); };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t.integrations.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">Verbind ClickWise om events in je CRM-workflow te gebruiken</p>
        </div>
      </div>

      {/* ClickWise Hero Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-card border border-border shadow-card overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl gradient-hero flex items-center justify-center shrink-0">
              <Zap className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-display text-xl font-bold text-foreground">ClickWise</h2>
                <Badge variant={status === "connected" ? "default" : "secondary"} className={status === "connected" ? "bg-accent text-accent-foreground" : ""}>
                  {status === "connected" && <Check className="w-3 h-3 mr-1" />}
                  {status === "error" && <AlertCircle className="w-3 h-3 mr-1" />}
                  {status === "connected" ? "Verbonden" : status === "error" ? "Fout" : "Niet verbonden"}
                </Badge>
                <Badge variant="outline" className="text-[10px]">Pro plan</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Koppel je ClickWise subaccount om eventdata automatisch te synchroniseren met je CRM, automations en follow-up workflows.
              </p>

              {/* Quick capabilities */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "Eventdata naar je CRM",
                  "Automatisering bij publicatie",
                  "Follow-up campagnes na events",
                  "Promotiecontent synchroniseren",
                  "Herinneringen via automation",
                  "Post-event remarketing",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3 h-3 text-accent/60 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview" className="gap-1.5"><Settings2 className="w-3.5 h-3.5" />Verbinding</TabsTrigger>
          <TabsTrigger value="sync" className="gap-1.5" disabled={status !== "connected"}><RefreshCw className="w-3.5 h-3.5" />Sync regels</TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5" disabled={status !== "connected"}><Activity className="w-3.5 h-3.5" />Logs</TabsTrigger>
        </TabsList>

        {/* Connection Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <AnimatePresence mode="wait">
            {status === "disconnected" ? (
              <motion.div key="connect" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-xl border border-dashed border-border p-6 space-y-4">
                <h3 className="font-display font-semibold text-foreground">Verbind je ClickWise account</h3>
                <p className="text-sm text-muted-foreground">
                  Voer je ClickWise subaccount ID in om de koppeling te starten. Je vindt dit in je ClickWise dashboard onder Instellingen → API.
                </p>
                <div className="flex gap-3 items-end max-w-md">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Subaccount ID</label>
                    <Input placeholder="bijv. sub_abc123xyz" value={subaccountId} onChange={(e) => setSubaccountId(e.target.value)} className="h-9" />
                  </div>
                  <Button onClick={handleConnect} disabled={!subaccountId.trim()} className="gap-2 gradient-hero text-primary-foreground border-0 hover:opacity-90 h-9">
                    <Link2 className="w-4 h-4" />Verbinden
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground/60">Je API key wordt veilig opgeslagen en is nooit zichtbaar.</p>
              </motion.div>
            ) : (
              <motion.div key="connected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Connection details */}
                <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-semibold text-foreground">Verbindingsdetails</h3>
                    <Button variant="ghost" size="sm" onClick={handleDisconnect} className="text-destructive hover:text-destructive gap-1.5 text-xs">
                      <Unlink className="w-3.5 h-3.5" />Ontkoppelen
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground">Status</span>
                      <p className="flex items-center gap-1.5 text-accent font-medium"><span className="w-2 h-2 rounded-full bg-accent" />Actief</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Subaccount</span>
                      <p className="font-mono text-xs">{subaccountId || "sub_demo_account"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Laatst gesynchroniseerd</span>
                      <p className="text-foreground">2 minuten geleden</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Verbonden sinds</span>
                      <p className="text-foreground">6 apr 2026</p>
                    </div>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Events gesynchroniseerd", value: "12", icon: Send },
                    { label: "Succesvolle syncs", value: "28", icon: Check },
                    { label: "Actieve regels", value: String(syncRules.filter((r) => r.enabled).length), icon: RefreshCw },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg border border-border bg-card p-4 text-center">
                      <s.icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                      <p className="text-2xl font-bold text-foreground">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* Sync Rules Tab */}
        <TabsContent value="sync" className="space-y-4 mt-4">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-display font-semibold text-foreground">Synchronisatie regels</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Bepaal welke events automatisch naar ClickWise worden gestuurd</p>
            </div>
            <div className="divide-y divide-border">
              {syncRules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{rule.label}</p>
                      <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{rule.trigger}</code>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>
                  </div>
                  <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                </div>
              ))}
            </div>
          </div>

          {/* Webhook info */}
          <div className="rounded-xl border border-dashed border-border p-5 space-y-2">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary" />
              <h4 className="font-display font-semibold text-sm text-foreground">Webhook endpoint</h4>
              <Badge variant="outline" className="text-[10px]">Automatisch</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Inkomende webhooks van ClickWise worden automatisch verwerkt via het platform. Je hoeft geen URL te configureren.</p>
            <code className="block text-[11px] font-mono bg-muted/50 p-2 rounded text-muted-foreground break-all">
              https://api.txpromoshare.nl/webhooks/clickwise/&#123;tenant_id&#125;
            </code>
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4 mt-4">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-foreground">Sync logboek</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Recente synchronisatie-acties met ClickWise</p>
              </div>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                <RefreshCw className="w-3.5 h-3.5" />Vernieuwen
              </Button>
            </div>
            <div className="divide-y divide-border">
              {mockLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${log.status === "success" ? "bg-accent" : log.status === "failed" ? "bg-destructive" : "bg-muted-foreground/40"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{log.event}</p>
                      <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{log.trigger}</code>
                    </div>
                    {log.detail && <p className="text-[11px] text-destructive mt-0.5">{log.detail}</p>}
                  </div>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">{log.timestamp}</span>
                </div>
              ))}
            </div>
            {mockLogs.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">Nog geen synchronisatie-acties</div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Future: Calendar integration teaser */}
      <div className="rounded-xl border border-dashed border-border p-5 opacity-60">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
              Kalender integratie
              <Badge variant="outline" className="text-[10px]">{t.common.comingSoon}</Badge>
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Google Calendar & ICS download op publieke eventpagina's</p>
          </div>
        </div>
      </div>

      {/* Future: Ticketing teaser */}
      <div className="rounded-xl border border-dashed border-border p-5 opacity-60">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <span className="text-xl">🎟️</span>
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
              Ticketing Module
              <Badge variant="outline" className="text-[10px]">{t.common.futureModule}</Badge>
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Mollie & Stripe betalingen, QR-codes, scannen, mobile wallet</p>
          </div>
        </div>
      </div>
    </div>
  );
}
