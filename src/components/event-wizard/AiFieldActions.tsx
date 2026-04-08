import { useState } from "react";
import { Sparkles, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useAiAssist } from "@/hooks/useAiAssist";
import { useTenant } from "@/hooks/useTenant";

interface AiFieldActionsProps {
  fieldName: string;
  currentText: string;
  onResult: (text: string) => void;
  eventContext?: {
    title?: string;
    category?: string;
    description?: string;
  };
  actions?: AiFieldAction[];
  compact?: boolean;
}

interface AiFieldAction {
  id: string;
  label: string;
  instruction: string;
  icon?: string;
}

const DEFAULT_ACTIONS: AiFieldAction[] = [
  { id: "generate", label: "Genereer", instruction: "Genereer een nieuwe tekst voor dit veld op basis van de eventcontext", icon: "✨" },
  { id: "rewrite", label: "Herschrijf", instruction: "Herschrijf de tekst. Behoud de kern maar maak het beter", icon: "🔄" },
  { id: "shorter", label: "Maak korter", instruction: "Maak de tekst korter en bondiger", icon: "✂️" },
  { id: "enthusiastic", label: "Maak enthousiaster", instruction: "Maak de tekst enthousiaster en wervender", icon: "🎉" },
  { id: "professional", label: "Maak professioneler", instruction: "Maak de tekst professioneler en zakelijker", icon: "💼" },
  { id: "seo", label: "Optimaliseer voor SEO", instruction: "Optimaliseer de tekst voor zoekmachines, gebruik relevante zoekwoorden", icon: "🔍" },
  { id: "whatsapp", label: "Geschikt voor WhatsApp", instruction: "Maak de tekst geschikt voor WhatsApp: kort, informeel, met emoji's", icon: "💬" },
  { id: "instagram", label: "Geschikt voor Instagram", instruction: "Maak de tekst geschikt voor Instagram: visueel, met hashtags en emoji's", icon: "📸" },
];

export function AiFieldActions({
  fieldName,
  currentText,
  onResult,
  eventContext,
  actions = DEFAULT_ACTIONS,
  compact = false,
}: AiFieldActionsProps) {
  const { run, loading } = useAiAssist();
  const { tenant } = useTenant();
  const isLoading = loading === "field_rewrite";

  const handleAction = async (action: AiFieldAction) => {
    // For "generate", allow empty text
    if (action.id !== "generate" && !currentText.trim()) return;

    const res = await run({
      task: "field_rewrite",
      context: {
        instruction: action.instruction,
        fieldName,
        text: currentText,
        title: eventContext?.title || "",
        category: eventContext?.category || "",
        brandTone: tenant?.tone_of_voice || "",
      },
    });

    if (res?.text) {
      onResult(res.text);
    }
  };

  // Filter: only show "generate" when text is empty, hide it when text exists
  const visibleActions = currentText.trim()
    ? actions.filter(a => a.id !== "generate")
    : actions.filter(a => a.id === "generate");

  if (visibleActions.length === 0) return null;

  // Single action mode
  if (visibleActions.length === 1) {
    const action = visibleActions[0];
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => handleAction(action)}
        disabled={isLoading}
        className="gap-1.5 text-primary hover:text-primary hover:bg-primary/10 h-7"
      >
        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
        <span className="text-xs font-medium">{action.label}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isLoading}
          className="gap-1 text-primary hover:text-primary hover:bg-primary/10 h-7"
        >
          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          {!compact && <span className="text-xs font-medium">AI</span>}
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-[10px] text-muted-foreground">AI acties</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {visibleActions.map((action) => (
          <DropdownMenuItem key={action.id} onClick={() => handleAction(action)} className="text-xs gap-2">
            {action.icon && <span>{action.icon}</span>}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
