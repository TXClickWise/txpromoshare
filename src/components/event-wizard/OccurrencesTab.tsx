import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CalendarDays, MoreHorizontal, Eye, EyeOff, XCircle, Copy,
  Clock, Tag, RefreshCw, CheckSquare, ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Occurrence {
  id: string;
  event_id: string;
  tenant_id: string;
  occurrence_date: string;
  start_time: string | null;
  end_time: string | null;
  status: string;
  label: string | null;
  overrides: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface OccurrencesTabProps {
  eventId: string;
  tenantId: string;
  defaultStartTime: string;
  defaultEndTime: string;
}

export function OccurrencesTab({ eventId, tenantId, defaultStartTime, defaultEndTime }: OccurrencesTabProps) {
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Occurrence>>({});
  const [bulkAction, setBulkAction] = useState("");
  const [bulkTime, setBulkTime] = useState({ start: "", end: "" });
  const [sortAsc, setSortAsc] = useState(true);

  const loadOccurrences = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("event_occurrences")
      .select("*")
      .eq("event_id", eventId)
      .order("occurrence_date", { ascending: true });
    if (!error && data) {
      setOccurrences(data as Occurrence[]);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => { loadOccurrences(); }, [loadOccurrences]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === occurrences.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(occurrences.map(o => o.id)));
    }
  };

  const updateOccurrence = async (id: string, updates: { occurrence_date?: string; start_time?: string | null; end_time?: string | null; status?: string; label?: string | null }) => {
    const { error } = await supabase
      .from("event_occurrences")
      .update(updates)
      .eq("id", id);
    if (error) {
      toast.error("Bijwerken mislukt: " + error.message);
    } else {
      toast.success("Occurrence bijgewerkt");
      loadOccurrences();
    }
    setEditingId(null);
  };

  const duplicateOccurrence = async (occ: Occurrence) => {
    const nextDay = new Date(occ.occurrence_date);
    nextDay.setDate(nextDay.getDate() + 1);
    const { error } = await supabase.from("event_occurrences").insert({
      event_id: eventId,
      tenant_id: tenantId,
      occurrence_date: nextDay.toISOString().split("T")[0],
      start_time: occ.start_time,
      end_time: occ.end_time,
      status: "active",
      label: occ.label,
    });
    if (error) {
      toast.error(error.message.includes("unique") ? "Er bestaat al een occurrence op die datum" : error.message);
    } else {
      toast.success("Occurrence gedupliceerd");
      loadOccurrences();
    }
  };

  const executeBulkAction = async () => {
    if (selected.size === 0) { toast.error("Selecteer eerst occurrences"); return; }
    const ids = Array.from(selected);

    let updates: { status?: string; start_time?: string | null; end_time?: string | null } = {};
    switch (bulkAction) {
      case "hide": updates = { status: "hidden" }; break;
      case "cancel": updates = { status: "cancelled" }; break;
      case "activate": updates = { status: "active" }; break;
      case "change_time":
        if (!bulkTime.start) { toast.error("Vul een starttijd in"); return; }
        updates = { start_time: bulkTime.start, end_time: bulkTime.end || null };
        break;
      default: return;
    }

    const { error } = await supabase
      .from("event_occurrences")
      .update(updates)
      .in("id", ids);

    if (error) {
      toast.error("Bulk-actie mislukt: " + error.message);
    } else {
      toast.success(`${ids.length} occurrence(s) bijgewerkt`);
      setSelected(new Set());
      setBulkAction("");
      loadOccurrences();
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge variant="default" className="bg-success/15 text-success border-success/30 text-xs">Actief</Badge>;
      case "hidden": return <Badge variant="secondary" className="text-xs"><EyeOff className="w-3 h-3 mr-1" />Verborgen</Badge>;
      case "cancelled": return <Badge variant="destructive" className="text-xs"><XCircle className="w-3 h-3 mr-1" />Geannuleerd</Badge>;
      default: return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const sorted = sortAsc
    ? [...occurrences]
    : [...occurrences].reverse();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Occurrences ({occurrences.length})</h3>
          <p className="text-xs text-muted-foreground">Beheer individuele datums van dit terugkerend event</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadOccurrences} className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          Vernieuwen
        </Button>
      </div>

      {occurrences.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <CalendarDays className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nog geen occurrences gegenereerd.</p>
          <p className="text-xs text-muted-foreground mt-1">Sla het event eerst op om datums te genereren.</p>
        </div>
      ) : (
        <>
          {/* Bulk Actions */}
          {selected.size > 0 && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-primary">
                <CheckSquare className="w-3.5 h-3.5 inline mr-1" />
                {selected.size} geselecteerd
              </span>
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue placeholder="Kies actie..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activate">Activeren</SelectItem>
                  <SelectItem value="hide">Verbergen</SelectItem>
                  <SelectItem value="cancel">Annuleren</SelectItem>
                  <SelectItem value="change_time">Tijd wijzigen</SelectItem>
                </SelectContent>
              </Select>
              {bulkAction === "change_time" && (
                <div className="flex gap-2">
                  <Input type="time" value={bulkTime.start} onChange={e => setBulkTime(p => ({ ...p, start: e.target.value }))} className="w-28 h-8 text-xs" />
                  <Input type="time" value={bulkTime.end} onChange={e => setBulkTime(p => ({ ...p, end: e.target.value }))} className="w-28 h-8 text-xs" />
                </div>
              )}
              {bulkAction && (
                <Button size="sm" onClick={executeBulkAction} className="h-8 text-xs">
                  Toepassen
                </Button>
              )}
            </div>
          )}

          {/* Table */}
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selected.size === occurrences.length && occurrences.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="text-xs">
                    <button type="button" onClick={() => setSortAsc(!sortAsc)} className="flex items-center gap-1 hover:text-foreground">
                      Datum <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs">Tijd</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Label</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map(occ => {
                  const isEditing = editingId === occ.id;
                  const isPast = new Date(occ.occurrence_date) < new Date(new Date().toISOString().split("T")[0]);
                  return (
                    <TableRow key={occ.id} className={`${isPast ? "opacity-50" : ""} ${selected.has(occ.id) ? "bg-primary/5" : ""}`}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(occ.id)}
                          onCheckedChange={() => toggleSelect(occ.id)}
                        />
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {isEditing ? (
                          <Input
                            type="date"
                            value={editValues.occurrence_date || occ.occurrence_date}
                            onChange={e => setEditValues(p => ({ ...p, occurrence_date: e.target.value }))}
                            className="h-7 text-xs w-36"
                          />
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <CalendarDays className="w-3 h-3 text-muted-foreground" />
                            {new Date(occ.occurrence_date).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <Input
                              type="time"
                              value={editValues.start_time ?? occ.start_time ?? defaultStartTime}
                              onChange={e => setEditValues(p => ({ ...p, start_time: e.target.value }))}
                              className="h-7 text-xs w-24"
                            />
                            <Input
                              type="time"
                              value={editValues.end_time ?? occ.end_time ?? defaultEndTime}
                              onChange={e => setEditValues(p => ({ ...p, end_time: e.target.value }))}
                              className="h-7 text-xs w-24"
                            />
                          </div>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {occ.start_time || defaultStartTime}
                            {(occ.end_time || defaultEndTime) && ` – ${occ.end_time || defaultEndTime}`}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{statusBadge(occ.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {isEditing ? (
                          <Input
                            value={editValues.label ?? occ.label ?? ""}
                            onChange={e => setEditValues(p => ({ ...p, label: e.target.value }))}
                            placeholder="Bijv. Kerstspecial"
                            className="h-7 text-xs w-32"
                          />
                        ) : (
                          occ.label && (
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />{occ.label}
                            </span>
                          )
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => {
                              updateOccurrence(occ.id, editValues);
                            }}>
                              Opslaan
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>
                              Annuleer
                            </Button>
                          </div>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="text-xs">
                              <DropdownMenuItem onClick={() => { setEditingId(occ.id); setEditValues({}); }}>
                                <CalendarDays className="w-3.5 h-3.5 mr-2" />Bewerken
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => duplicateOccurrence(occ)}>
                                <Copy className="w-3.5 h-3.5 mr-2" />Dupliceren
                              </DropdownMenuItem>
                              {occ.status !== "hidden" && (
                                <DropdownMenuItem onClick={() => updateOccurrence(occ.id, { status: "hidden" })}>
                                  <EyeOff className="w-3.5 h-3.5 mr-2" />Verbergen
                                </DropdownMenuItem>
                              )}
                              {occ.status === "hidden" && (
                                <DropdownMenuItem onClick={() => updateOccurrence(occ.id, { status: "active" })}>
                                  <Eye className="w-3.5 h-3.5 mr-2" />Zichtbaar maken
                                </DropdownMenuItem>
                              )}
                              {occ.status !== "cancelled" && (
                                <DropdownMenuItem onClick={() => updateOccurrence(occ.id, { status: "cancelled" })} className="text-destructive">
                                  <XCircle className="w-3.5 h-3.5 mr-2" />Annuleren
                                </DropdownMenuItem>
                              )}
                              {occ.status === "cancelled" && (
                                <DropdownMenuItem onClick={() => updateOccurrence(occ.id, { status: "active" })}>
                                  <Eye className="w-3.5 h-3.5 mr-2" />Heractiveren
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>✅ {occurrences.filter(o => o.status === "active").length} actief</span>
            <span>👁️ {occurrences.filter(o => o.status === "hidden").length} verborgen</span>
            <span>❌ {occurrences.filter(o => o.status === "cancelled").length} geannuleerd</span>
          </div>
        </>
      )}
    </motion.div>
  );
}
