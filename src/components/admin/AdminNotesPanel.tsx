import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";

interface Note {
  id: string;
  content: string;
  created_at: string;
  created_by: string | null;
}

interface Props {
  entityType: string;
  entityId: string;
  notes: Note[];
  onChange: () => void;
}

export function AdminNotesPanel({ entityType, entityId, notes, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!content.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("admin_notes").insert({
      entity_type: entityType,
      entity_id: entityId,
      content: content.trim(),
      created_by: user?.id || null,
    });
    setSaving(false);
    if (error) {
      toast.error("Kon notitie niet opslaan");
      return;
    }
    toast.success("Notitie toegevoegd");
    setContent("");
    setAdding(false);
    onChange();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("admin_notes").delete().eq("id", id);
    if (error) {
      toast.error("Kon notitie niet verwijderen");
      return;
    }
    toast.success("Notitie verwijderd");
    onChange();
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-sm text-foreground flex items-center gap-1.5">
            <StickyNote className="w-3.5 h-3.5 text-muted-foreground" />
            Interne notities <span className="text-muted-foreground font-normal">({notes.length})</span>
          </h3>
          {!adding && (
            <Button variant="ghost" size="sm" onClick={() => setAdding(true)} className="gap-1.5 text-xs">
              <Plus className="w-3 h-3" /> Toevoegen
            </Button>
          )}
        </div>

        {adding && (
          <div className="space-y-2 p-3 rounded-lg bg-secondary/40 border border-border">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Schrijf een interne notitie over deze organisatie..."
              rows={3}
              className="text-sm resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setAdding(false); setContent(""); }}>Annuleren</Button>
              <Button size="sm" onClick={save} disabled={saving || !content.trim()}>
                {saving ? "Opslaan…" : "Opslaan"}
              </Button>
            </div>
          </div>
        )}

        {notes.length === 0 && !adding && (
          <p className="text-xs text-muted-foreground italic">Nog geen notities. Voeg interne context toe voor jezelf en collega-admins.</p>
        )}

        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="group p-3 rounded-lg bg-secondary/40 border border-border">
              <p className="text-sm text-foreground whitespace-pre-wrap">{n.content}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  {format(new Date(n.created_at), "d MMM yyyy 'om' HH:mm", { locale: nl })}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(n.id)}
                  className="h-6 px-2 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
