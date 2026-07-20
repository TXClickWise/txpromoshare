import { cn } from "@/lib/utils";

type Variant = "light" | "dark";
type Size = "sm" | "md" | "lg";

interface LogoProps {
  variant?: Variant;
  size?: Size;
  showTagline?: boolean;
  className?: string;
}

const sizeMap: Record<Size, { mark: string; markText: string; word: string; tagline: string; gap: string; radius: string }> = {
  sm: { mark: "h-7 w-7", markText: "text-xs", word: "text-base", tagline: "text-[10px]", gap: "gap-1.5", radius: "rounded-md" },
  md: { mark: "h-9 w-9", markText: "text-sm", word: "text-lg", tagline: "text-xs", gap: "gap-2", radius: "rounded-lg" },
  lg: { mark: "h-12 w-12", markText: "text-base", word: "text-2xl", tagline: "text-sm", gap: "gap-2.5", radius: "rounded-xl" },
};

export function Logo({ variant = "light", size = "md", showTagline = false, className }: LogoProps) {
  const s = sizeMap[size];
  const isDark = variant === "dark";

  const markBg = isDark ? "bg-accent" : "bg-primary";
  const markFg = isDark ? "text-accent-foreground" : "text-accent";
  const wordFg = isDark ? "text-white" : "text-primary";
  const taglineFg = isDark ? "text-on-dark-muted" : "text-muted-foreground";

  return (
    <span
      aria-label="TX EventShare"
      className={cn("inline-flex items-center font-display leading-none select-none", s.gap, className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex items-center justify-center font-extrabold tracking-tight",
          s.mark,
          s.markText,
          s.radius,
          markBg,
          markFg,
        )}
      >
        TX
      </span>
      <span aria-hidden="true" className="inline-flex flex-col">
        <span className={cn("font-bold tracking-tight", s.word, wordFg)}>EventShare</span>
        {showTagline && (
          <span className={cn("mt-0.5 font-medium", s.tagline, taglineFg)}>
            Create once. Share everywhere.
          </span>
        )}
      </span>
    </span>
  );
}

export default Logo;