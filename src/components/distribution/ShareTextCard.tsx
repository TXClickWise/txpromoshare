import { Copy, Check, Pencil, Sparkles, Loader2, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ShareTextCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  text: string;
  onTextChange?: (text: string) => void;
  actions?: React.ReactNode;
  editable?: boolean;
  channelId?: string;
  onAiRewrite?: (text: string, instruction: string) => Promise<string>;
  aiLoading?: boolean;
  charLimit?: number;
}

const AI_ACTIONS = [
  { id: "shorter", label: "Maak korter", icon: "✂️" },
  { id: "enthusiastic", label: "Maak enthousiaster", icon: "🎉" },
  { id: "professional", label: "Maak professioneler", icon: "💼" },
  { id: "onbrand", label: "Meer on-brand", icon: "🎨" },
  { id: "whatsapp", label: "Optimaliseer voor WhatsApp", icon: "💬" },
  { id: "instagram", label: "Optimaliseer voor Instagram", icon: "📸" },
  { id: "tiktok", label: "Optimaliseer voor TikTok", icon: "🎵" },
  { id: "gbp", label: "Optimaliseer voor Google", icon: "📍" },
  { id: "seo", label: "Optimaliseer voor SEO", icon: "🔍" },
];

export function ShareTextCard({
  icon, title, description, text, onTextChange, actions,
  editable = true, channelId, onAiRewrite, aiLoading, charLimit,
}: ShareTextCardProps) {
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

  const handleAiAction = async (actionId: string) => {
    if (!onAiRewrite) return;
    const action = AI_ACTIONS.find((a) => a.id === actionId);
    if (!action) return;
    try {
      const result = await onAiRewrite(text, action.label);
      if (result) {
        setEditText(result);
        onTextChange?.(result);
      }
    } catch {
      toast.error("AI herschrijven mislukt");
    }
  };

  const charCount = text.length;
  const isOverLimit = charLimit ? charCount > charLimit : false;

  return (
    <div className="p-4 rounded-xl bg-card border border-border shadow-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-foreground text-sm truncate">{title}</h3>
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onAiRewrite && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" disabled={aiLoading}>
                  {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  AI
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {AI_ACTIONS.map((action) => (
                  <DropdownMenuItem key={action.id} onClick={() => handleAiAction(action.id)} className="text-xs gap-2">
                    <span>{action.icon}</span>
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {editable && !editing && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditText(text); setEditing(true); }}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="text-xs min-h-[80px] font-mono"
          />
          <div className="flex items-center justify-between">
            {charLimit && (
              <span className={`text-xs ${isOverLimit ? "text-destructive" : "text-muted-foreground"}`}>
                {editText.length}/{charLimit}
              </span>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setEditText(text); }}>Annuleren</Button>
              <Button size="sm" onClick={save}>Opslaan</Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground bg-secondary p-3 rounded-lg whitespace-pre-line leading-relaxed max-h-[200px] overflow-y-auto">
          {text}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={copy} className="gap-2 text-xs">
          {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Gekopieerd!" : "Kopieer"}
        </Button>
        {charLimit && (
          <span className={`text-xs ${isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"}`}>
            {charCount} tekens{charLimit ? ` / ${charLimit}` : ""}
          </span>
        )}
        {actions}
      </div>
    </div>
  );
}
