import { motion } from "framer-motion";
import { Crop, Smartphone, Square as SquareIcon, Monitor, Share2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ImageRoleKey = "featured" | "gallery" | "card" | "widget" | "social" | "square";

export interface ImageRoleSpec {
  key: ImageRoleKey;
  label: string;
  ratio: string;
  ratioValue: number; // width / height
  minWidth: number;
  minHeight: number;
  description: string;
  icon: typeof Crop;
  usage: string[];
}

export const IMAGE_ROLE_SPECS: Record<ImageRoleKey, ImageRoleSpec> = {
  featured: {
    key: "featured",
    label: "Hero / Uitgelicht",
    ratio: "16:9",
    ratioValue: 16 / 9,
    minWidth: 1200,
    minHeight: 675,
    description: "Hoofdafbeelding bovenaan event-pagina's en cards.",
    icon: Monitor,
    usage: ["Publieke event-pagina", "Event card grid", "Agenda widget"],
  },
  social: {
    key: "social",
    label: "Social Share",
    ratio: "1.91:1",
    ratioValue: 1.91,
    minWidth: 1200,
    minHeight: 628,
    description: "Optimaal voor WhatsApp, Facebook en LinkedIn previews.",
    icon: Share2,
    usage: ["WhatsApp preview", "Facebook OG image", "LinkedIn preview"],
  },
  square: {
    key: "square",
    label: "Vierkant",
    ratio: "1:1",
    ratioValue: 1,
    minWidth: 800,
    minHeight: 800,
    description: "Geschikt voor Instagram feed en thumbnails.",
    icon: SquareIcon,
    usage: ["Instagram feed", "Profielafbeelding", "Compacte widget"],
  },
  card: {
    key: "card",
    label: "Event Card",
    ratio: "16:9",
    ratioValue: 16 / 9,
    minWidth: 600,
    minHeight: 338,
    description: "Compacte voorvertoning in event-grids.",
    icon: Crop,
    usage: ["Dashboard cards", "Lijstweergave"],
  },
  widget: {
    key: "widget",
    label: "Widget",
    ratio: "3:2",
    ratioValue: 3 / 2,
    minWidth: 400,
    minHeight: 267,
    description: "Geoptimaliseerd voor externe embed-widgets.",
    icon: Smartphone,
    usage: ["Mobile widget", "Embedded agenda"],
  },
  gallery: {
    key: "gallery",
    label: "Galerij",
    ratio: "4:3",
    ratioValue: 4 / 3,
    minWidth: 800,
    minHeight: 600,
    description: "Aanvullende sfeerbeelden in de galerij.",
    icon: Crop,
    usage: ["Event galerij", "Aanvullende foto's"],
  },
};

interface CropHintGuideProps {
  imageUrl: string;
  imageWidth?: number | null;
  imageHeight?: number | null;
  role: ImageRoleKey;
  className?: string;
}

/**
 * Visualizes how an uploaded image will be cropped for a given role.
 * Shows the safe-area overlay and warns about resolution issues.
 */
export function CropHintGuide({ imageUrl, imageWidth, imageHeight, role, className }: CropHintGuideProps) {
  const spec = IMAGE_ROLE_SPECS[role];
  const hasMeta = !!(imageWidth && imageHeight);
  const tooSmall = hasMeta && (imageWidth! < spec.minWidth || imageHeight! < spec.minHeight);
  const imageRatio = hasMeta ? imageWidth! / imageHeight! : null;
  const ratioMismatch = imageRatio !== null && Math.abs(imageRatio - spec.ratioValue) > 0.15;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
            <spec.icon className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">{spec.label}</p>
            <p className="text-[10px] text-muted-foreground">
              {spec.ratio} • min {spec.minWidth}×{spec.minHeight}px
            </p>
          </div>
        </div>
        {hasMeta && (
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-medium",
              tooSmall
                ? "bg-destructive/10 text-destructive"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            )}
          >
            {imageWidth}×{imageHeight}
          </span>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-lg overflow-hidden border border-border bg-secondary/30"
        style={{ aspectRatio: spec.ratioValue }}
      >
        <img
          src={imageUrl}
          alt="Crop preview"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Safe-area frame */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[8%] border-2 border-dashed border-white/70 rounded-md" />
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm">
            <span className="text-[9px] text-white font-medium uppercase tracking-wider">
              Veilig kader
            </span>
          </div>
        </div>
      </motion.div>

      {(tooSmall || ratioMismatch) && (
        <div className="flex items-start gap-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            {tooSmall && (
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                Resolutie te laag — minimaal {spec.minWidth}×{spec.minHeight}px aanbevolen.
              </p>
            )}
            {ratioMismatch && !tooSmall && (
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                Verhouding wijkt af — afbeelding wordt bijgesneden naar {spec.ratio}.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-1">
        <p className="text-[10px] text-muted-foreground">{spec.description}</p>
        <div className="flex flex-wrap gap-1">
          {spec.usage.map((u) => (
            <span
              key={u}
              className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground"
            >
              {u}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

interface RolePresetSwitcherProps {
  activeRole: ImageRoleKey;
  onChange: (role: ImageRoleKey) => void;
  roles?: ImageRoleKey[];
  className?: string;
}

/**
 * Compact role-preset toggle. Lets users preview how the same image
 * would be cropped across Hero / Square / Social formats.
 */
export function RolePresetSwitcher({
  activeRole,
  onChange,
  roles = ["featured", "social", "square"],
  className,
}: RolePresetSwitcherProps) {
  return (
    <div className={cn("inline-flex rounded-lg bg-secondary/50 p-1 gap-1", className)}>
      {roles.map((key) => {
        const spec = IMAGE_ROLE_SPECS[key];
        const isActive = activeRole === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
              isActive
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <spec.icon className="w-3 h-3" />
            <span>{spec.label.split(" ")[0]}</span>
            <span className="text-[9px] text-muted-foreground/80">{spec.ratio}</span>
          </button>
        );
      })}
    </div>
  );
}
