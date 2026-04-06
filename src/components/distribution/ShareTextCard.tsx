import { Copy, Check, Pencil } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ShareTextCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  text: string;
  onTextChange?: (text: string) => void;
  actions?: React.ReactNode;
  editable?: boolean;
}

export function ShareTextCard({ icon, title, description, text, onTextChange, actions, editable = true }: ShareTextCardProps) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(text);

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Gekopieerd naar klembord");
    setTimeout(() => setCopied(false), 2000);
  };

  const save = () => {
    onTextChange?.(editText);
    setEditing(false);
    toast.success("Tekst bijgewerkt");
  };

  return (
    <div className="p-5 rounded-xl bg-card border border-border shadow-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h3 className="font-display font-semibold text-foreground text-sm">{title}</h3>
            <p className="text-[11px] text-muted-foreground">{description}</p>
          </div>
        </div>
        {editable && !editing && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="text-xs min-h-[80px] font-mono"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setEditText(text); }}>Annuleren</Button>
            <Button size="sm" onClick={save}>Opslaan</Button>
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground bg-secondary p-3 rounded-lg whitespace-pre-line leading-relaxed">
          {text}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={copy} className="gap-2">
          {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Gekopieerd!" : "Kopieer tekst"}
        </Button>
        {actions}
      </div>
    </div>
  );
}
