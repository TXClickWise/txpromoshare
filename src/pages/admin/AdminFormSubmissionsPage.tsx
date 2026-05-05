import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Inbox, Download, Mail, Phone, Building2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

type Submission = {
  id: string;
  form_type: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  data: Record<string, any> | null;
  source_url: string | null;
  created_at: string;
};

export default function AdminFormSubmissionsPage() {
  const [rows, setRows] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Submission | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("form_submissions")
        .select("id, form_type, contact_name, contact_email, contact_phone, data, source_url, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) console.error(error);
      setRows((data ?? []) as Submission[]);
      setLoading(false);
    })();
  }, []);

  function exportCsv() {
    const header = ["Datum", "Type", "Naam", "E-mail", "Telefoon", "Bedrijf", "Org type", "Bericht", "Bron"];
    const lines = [header.join(",")];
    for (const r of rows) {
      const cols = [
        r.created_at,
        r.form_type,
        r.contact_name ?? "",
        r.contact_email ?? "",
        r.contact_phone ?? "",
        r.data?.company ?? "",
        r.data?.org_type ?? "",
        (r.data?.message ?? "").replace(/\n/g, " "),
        r.source_url ?? "",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(cols.join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `form-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Inbox className="w-6 h-6" /> Formulier-inzendingen
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Inzendingen van het demo-formulier en andere publieke formulieren. Wordt ook doorgestuurd naar ClickWise via External Event tracking.
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Exporteer CSV
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-sm text-muted-foreground">Laden…</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-sm text-muted-foreground text-center">Nog geen inzendingen.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3">Datum</th>
                    <th className="text-left px-4 py-3">Type</th>
                    <th className="text-left px-4 py-3">Naam</th>
                    <th className="text-left px-4 py-3">E-mail</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelected(r)}
                      className={`border-t border-border cursor-pointer hover:bg-secondary/40 ${selected?.id === r.id ? "bg-secondary/60" : ""}`}
                    >
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {format(new Date(r.created_at), "d MMM yyyy HH:mm", { locale: nl })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs">{r.form_type}</span>
                      </td>
                      <td className="px-4 py-3 text-foreground">{r.contact_name || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.contact_email || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          {selected ? (
            <div className="space-y-3 text-sm">
              <div className="text-xs text-muted-foreground">
                {format(new Date(selected.created_at), "d MMMM yyyy 'om' HH:mm", { locale: nl })}
              </div>
              <div className="text-lg font-semibold text-foreground">{selected.contact_name || "Onbekend"}</div>
              {selected.contact_email && (
                <a href={`mailto:${selected.contact_email}`} className="flex items-center gap-2 text-primary hover:underline">
                  <Mail className="w-4 h-4" /> {selected.contact_email}
                </a>
              )}
              {selected.contact_phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" /> {selected.contact_phone}
                </div>
              )}
              {selected.data?.company && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="w-4 h-4" /> {selected.data.company}
                </div>
              )}
              {selected.data?.org_type && (
                <div className="text-muted-foreground"><span className="font-medium text-foreground">Type:</span> {selected.data.org_type}</div>
              )}
              {selected.data?.message && (
                <div className="pt-2 border-t border-border">
                  <div className="text-xs text-muted-foreground mb-1">Bericht</div>
                  <p className="whitespace-pre-wrap text-foreground">{selected.data.message}</p>
                </div>
              )}
              {selected.source_url && (
                <a href={selected.source_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground pt-2 border-t border-border">
                  <ExternalLink className="w-3 h-3" /> {selected.source_url}
                </a>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Selecteer een inzending om details te zien.</div>
          )}
        </div>
      </div>
    </div>
  );
}
