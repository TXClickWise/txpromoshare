import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building2, Users, Calendar, CreditCard, ArrowUpDown, StickyNote, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

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

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from("tenants").select("*").eq("id", id).single(),
      supabase.from("user_roles").select("*, profiles:user_id(id, full_name, phone, avatar_url, status)").eq("tenant_id", id),
      supabase.from("subscriptions").select("*").eq("tenant_id", id).maybeSingle(),
      supabase.from("plan_overrides").select("*").eq("tenant_id", id).order("created_at", { ascending: false }),
      supabase.from("events").select("id, title, status, start_date, created_at").eq("tenant_id", id).order("start_date", { ascending: false }).limit(10),
      supabase.from("admin_notes").select("*").eq("entity_type", "tenant").eq("entity_id", id).order("created_at", { ascending: false }),
      supabase.from("audit_log").select("*").eq("tenant_id", id).order("created_at", { ascending: false }).limit(20),
    ]).then(([t, m, s, o, e, n, a]) => {
      setTenant(t.data);
      setMembers(m.data || []);
      setSubscription(s.data);
      setOverrides(o.data || []);
      setEvents(e.data || []);
      setNotes(n.data || []);
      setAuditItems(a.data || []);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (!tenant) {
    return <div className="text-center py-12 text-muted-foreground">Organisatie niet gevonden</div>;
  }

  const activeOverride = overrides.find((o: any) => o.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/tenants"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{tenant.name}</h1>
          <p className="text-sm text-muted-foreground">{tenant.slug} · {tenant.email || "Geen e-mail"}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant={tenant.status === "active" ? "default" : "destructive"} className="capitalize">{tenant.status || "active"}</Badge>
          <Badge variant={tenant.plan_id === "pro" ? "default" : tenant.plan_id === "basic" ? "secondary" : "outline"} className="capitalize">{tenant.plan_id}</Badge>
          {activeOverride && <Badge variant="outline" className="border-orange-400 text-orange-600">Override: {activeOverride.override_plan_slug}</Badge>}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Teamleden</p><p className="text-2xl font-bold">{members.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Evenementen</p><p className="text-2xl font-bold">{events.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Plan</p><p className="text-2xl font-bold capitalize">{activeOverride ? activeOverride.override_plan_slug : tenant.plan_id}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Aangemaakt</p><p className="text-2xl font-bold">{format(new Date(tenant.created_at), "d MMM yy", { locale: nl })}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="members">Team ({members.length})</TabsTrigger>
          <TabsTrigger value="subscription">Abonnement</TabsTrigger>
          <TabsTrigger value="overrides">Overrides ({overrides.length})</TabsTrigger>
          <TabsTrigger value="events">Events ({events.length})</TabsTrigger>
          <TabsTrigger value="notes">Notities ({notes.length})</TabsTrigger>
          <TabsTrigger value="audit">Activiteit</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ["Naam", tenant.name],
                  ["Contactpersoon", tenant.contact_person],
                  ["E-mail", tenant.email],
                  ["Telefoon", tenant.phone],
                  ["Adres", tenant.address],
                  ["Stad", tenant.city],
                  ["Postcode", tenant.postal_code],
                  ["Land", tenant.country],
                  ["Bedrijfstype", tenant.business_type],
                  ["Website", tenant.website_url],
                  ["Primaire kleur", tenant.primary_color],
                  ["Status", tenant.status],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <span className="text-muted-foreground">{label}</span>
                    <p className="font-medium text-foreground">{(value as string) || "—"}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
                    ["Plan", subscription.plan_id],
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

        <TabsContent value="overrides">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Origineel</TableHead><TableHead>Override</TableHead><TableHead>Status</TableHead>
                  <TableHead>Start</TableHead><TableHead>Einde</TableHead><TableHead>Reden</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {overrides.map((o: any) => (
                    <TableRow key={o.id}>
                      <TableCell><Badge variant="outline" className="capitalize">{o.original_plan_slug}</Badge></TableCell>
                      <TableCell><Badge variant="default" className="capitalize">{o.override_plan_slug}</Badge></TableCell>
                      <TableCell><Badge variant={o.is_active ? "default" : "secondary"}>{o.is_active ? "Actief" : "Verlopen"}</Badge></TableCell>
                      <TableCell className="text-sm">{format(new Date(o.started_at), "d MMM yyyy", { locale: nl })}</TableCell>
                      <TableCell className="text-sm">{o.ends_at ? format(new Date(o.ends_at), "d MMM yyyy", { locale: nl }) : "Geen einddatum"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{o.reason || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {overrides.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Geen overrides</TableCell></TableRow>}
                </TableBody>
              </Table>
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

        <TabsContent value="notes">
          <Card>
            <CardContent className="pt-6 space-y-3">
              {notes.length === 0 && <p className="text-sm text-muted-foreground">Geen notities</p>}
              {notes.map((n: any) => (
                <div key={n.id} className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{n.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(n.created_at), "d MMM yyyy HH:mm", { locale: nl })}</p>
                </div>
              ))}
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
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(a.created_at), "d MMM yyyy HH:mm", { locale: nl })}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{a.metadata ? JSON.stringify(a.metadata) : "—"}</TableCell>
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
