import { MoreHorizontal, Copy, Share2, Archive, Trash2, Eye, Pencil, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface EventActionMenuProps {
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  status: string;
}

export function EventActionMenu({ eventId, eventTitle, eventSlug, status }: EventActionMenuProps) {
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.preventDefault()}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={(e) => { e.preventDefault(); navigate(`/app/events/${eventId}`); }}>
          <Pencil className="w-4 h-4 mr-2" />Bewerken
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.preventDefault(); toast.success("Preview geopend"); }}>
          <Eye className="w-4 h-4 mr-2" />Voorbeeld bekijken
        </DropdownMenuItem>
        {status === "published" && (
          <DropdownMenuItem onClick={(e) => { e.preventDefault(); window.open(`/e/${eventSlug}`, "_blank"); }}>
            <ExternalLink className="w-4 h-4 mr-2" />Publieke pagina
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={(e) => { e.preventDefault(); toast.success(`"${eventTitle}" gedupliceerd`); }}>
          <Copy className="w-4 h-4 mr-2" />Dupliceren
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.preventDefault(); navigate("/app/distribution"); }}>
          <Share2 className="w-4 h-4 mr-2" />Verspreiden
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={(e) => { e.preventDefault(); toast.success(`"${eventTitle}" gearchiveerd`); }}>
          <Archive className="w-4 h-4 mr-2" />Archiveren
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.preventDefault(); toast.error(`"${eventTitle}" verwijderd`); }}>
          <Trash2 className="w-4 h-4 mr-2" />Verwijderen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
