import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ExternalLink, Mail, Phone, MapPin, Globe } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { AdminTenantUsagePanel } from "@/components/admin/AdminTenantUsagePanel";
import { AdminTenantOverridePanel } from "@/components/admin/AdminTenantOverridePanel";
import { AdminNotesPanel } from "@/components/admin/AdminNotesPanel";
import type { PlanId } from "@/lib/plans";

export default function AdminTenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [auditItems, setAuditItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!id) return;
    const [t, m, s, o, e, n, a] = await Promise.all([
      supabase.from("tenants").select("*").eq("id", id).single(),
      supabase.from("user_roles").select("*, profiles:user_id(id, full_name, phone, avatar_url, status)").eq("tenant_id", id),
      supabase.from("subscriptions").select("*").eq("tenant_id", id).maybeSingle(),
      supabase.from("plan_overrides").select("*").eq("tenant_id", id).order("created_at", { ascending: false }),
      supabase.from("events").select("id, title, status, start_date, created_at").eq("tenant_id", id).order("start_date", { ascending: false }).limit(10),
      supabase.from("admin_notes").select("*").eq("entity_type", "tenant").eq("entity_id", id).order("created_at", { ascending: false }),
      supabase.from("audit_log").select("*").eq("tenant_id", id).order("created_at", { ascending: false }).limit(20),
    ]);
    setTenant(t.data);
    setMembers(m.data || []);
    setSubscription(s.data);
    setOverrides(o.data || []);
    setEvents(e.data || []);
    setNotes(n.data || []);
    setAuditItems(a.data || []);
    setLoading(false);
  }, [id]);

  const reloadNotes = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase.from("admin_notes").select("*").eq("entity_type", "tenant").eq("entity_id", id).order("created_at", { ascending: false });
    setNotes(data || []);
  }, [id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (!tenant) {
    return <div className="text-center py-12 text-muted-foreground">Organisatie niet gevonden</div>;
  }

  const activeOverride = overrides.find((o: any) => o.is_active);
  const effectivePlan = (activeOverride?.override_plan_slug || tenant.plan_id) as PlanId;
  const subStatus = subscription?.status || "—";

  return (
    <div className="space-y-6">
      {/* Hero / key facts */}
      <div className="flex items-start gap-3 flex-wrap">
        <Link to="/admin/tenants"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-display font-bold text-foreground truncate">{tenant.name}</h1>
            <Badge variant={tenant.status === "active" ? "default" : "destructive"} className="capitalize">{tenant.status || "active"}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            <span className="font-mono text-xs">{tenant.slug}</span>
            {" · "}
            Aangemaakt {format(new Date(tenant.created_at), "d MMM yyyy", { locale: nl })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="capitalize">Plan: {tenant.plan_id}</Badge>
          {activeOverride && (
            <Badge className="bg-primary/15 text-primary hover:bg-primary/15 border-0 capitalize">
              Override → {activeOverride.override_plan_slug}
            </Badge>
          )}
          <Badge variant="secondary" className="capitalize">Sub: {subStatus}</Badge>
        </div>
      </div>

      {/* Contact strip */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {tenant.contact_person && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="text-foreground font-medium">{tenant.contact_person}</span>
              </div>
            )}
            {tenant.email && (
              <a href={`mailto:${tenant.email}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                <Mail className="w-3.5 h-3.5" /> {tenant.email}
              </a>
            )}
            {tenant.phone && (
              <a href={`tel:${tenant.phone}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                <Phone className="w-3.5 h-3.5" /> {tenant.phone}
              </a>
            )}
            {(tenant.city || tenant.address) && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" /> {[tenant.address, tenant.postal_code, tenant.city].filter(Boolean).join(", ")}
              </div>
            )}
            {tenant.website_url && (
              <a href={tenant.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                <Globe className="w-3.5 h-3.5" /> {tenant.website_url.replace(/^https?:\/\//, "")} <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top panels: Usage + Override side by side */}
      <div className="grid lg:grid-cols-2 gap-4">
        <AdminTenantUsagePanel tenantId={tenant.id} effectivePlanId={effectivePlan} />
        <AdminTenantOverridePanel tenantId={tenant.id} basePlan={tenant.plan_id} overrides={overrides} />
      </div>

      {/* Notes panel — directly visible */}
      <AdminNotesPanel entityType="tenant" entityId={tenant.id} notes={notes} onChange={reloadNotes} />

      {/* Detail tabs */}
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Team ({members.length})</TabsTrigger>
          <TabsTrigger value="subscription">Abonnement</TabsTrigger>
          <TabsTrigger value="events">Events ({events.length})</TabsTrigger>
          <TabsTrigger value="details">Bedrijfsgegevens</TabsTrigger>
          <TabsTrigger value="audit">Activiteit ({auditItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Naam</TableHead><TableHead>Rol</TableHead><TableHead>Status</TableHead><TableHead>Toegevoegd</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {members.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{(m.profiles as any)?.full_name || "Onbekend"}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize text-xs">{m.role}</Badge></TableCell>
                      <TableCell><Badge variant={m.accepted_at ? "default" : "secondary"}>{m.accepted_at ? "Actief" : "Uitgenodigd"}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(m.invited_at), "d MMM yyyy", { locale: nl })}</TableCell>
                    </TableRow>
                  ))}
                  {members.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Geen teamleden</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription">
          <Card>
            <CardContent className="pt-6">
              {subscription ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    ["Plan (subscription)", subscription.plan_id],
                    ["Status", subscription.status],
                    ["Stripe Customer", subscription.stripe_customer_id || "—"],
                    ["Stripe Subscription", subscription.stripe_subscription_id || "—"],
                    ["Periode start", subscription.current_period_start ? format(new Date(subscription.current_period_start), "d MMM yyyy", { locale: nl }) : "—"],
                    ["Periode einde", subscription.current_period_end ? format(new Date(subscription.current_period_end), "d MMM yyyy", { locale: nl }) : "—"],
                    ["Geannuleerd", subscription.canceled_at ? format(new Date(subscription.canceled_at), "d MMM yyyy", { locale: nl }) : "Nee"],
                  ].map(([label, value]) => (
                    <div key={label as string}>
                      <span className="text-muted-foreground">{label}</span>
                      <p className="font-medium text-foreground capitalize">{value as string}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Geen abonnement gevonden</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Titel</TableHead><TableHead>Status</TableHead><TableHead>Datum</TableHead></TableRow></TableHeader>
                <TableBody>
                  {events.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.title}</TableCell>
                      <TableCell><Badge variant={e.status === "published" ? "default" : "outline"} className="capitalize">{e.status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(e.start_date), "d MMM yyyy", { locale: nl })}</TableCell>
                    </TableRow>
                  ))}
                  {events.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Geen evenementen</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardContent className="pt-6">
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                {[
                  ["Naam", tenant.name],
                  ["Slug", tenant.slug],
                  ["Contactpersoon", tenant.contact_person],
                  ["E-mail", tenant.email],
                  ["Telefoon", tenant.phone],
                  ["Adres", tenant.address],
                  ["Postcode", tenant.postal_code],
                  ["Stad", tenant.city],
                  ["Land", tenant.country],
                  ["Bedrijfstype", tenant.business_type],
                  ["Website", tenant.website_url],
                  ["Tone of voice", tenant.tone_of_voice],
                  ["Primaire kleur", tenant.primary_color],
                  ["Status", tenant.status],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">{label}</span>
                    <p className="font-medium text-foreground mt-0.5">{(value as string) || <span className="text-muted-foreground italic">—</span>}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Actie</TableHead><TableHead>Type</TableHead><TableHead>Datum</TableHead><TableHead>Details</TableHead></TableRow></TableHeader>
                <TableBody>
                  {auditItems.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium capitalize">{a.action}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.entity_type}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{format(new Date(a.created_at), "d MMM yyyy HH:mm", { locale: nl })}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate font-mono">{a.metadata ? JSON.stringify(a.metadata) : "—"}</TableCell>
                    </TableRow>
                  ))}
                  {auditItems.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Geen activiteit</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
