import { useRef, useState, useEffect, useCallback } from "react";
import { Upload, X, AlertTriangle, CheckCircle2, Loader2, ImageIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useUILanguage";

interface LogoMeta {
  width: number;
  height: number;
  hasTransparency: boolean;
  fileSize: number;
  fileType: string;
}

interface LogoUploaderProps {
  logoUrl: string | null;
  primaryColor?: string;
  uploading?: boolean;
  onUpload: (file: File) => void | Promise<void>;
  onRemove: () => void | Promise<void>;
}

const MIN_DIMENSION = 200;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED = "image/png,image/svg+xml,image/jpeg,image/webp";

/**
 * Detect transparency in an image by sampling pixels via canvas.
 * SVGs are assumed transparent. Returns null if detection fails (e.g. CORS).
 */
async function detectImageMeta(url: string, fileType?: string): Promise<LogoMeta | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;

      // SVG → assume transparent
      if (fileType === "image/svg+xml" || url.toLowerCase().endsWith(".svg")) {
        resolve({ width, height, hasTransparency: true, fileSize: 0, fileType: fileType || "image/svg+xml" });
        return;
      }

      try {
        const canvas = document.createElement("canvas");
        const sampleSize = 80;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ width, height, hasTransparency: false, fileSize: 0, fileType: fileType || "image/png" });
          return;
        }
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
        let transparentPixels = 0;
        const corners = [
          [0, 0],
          [sampleSize - 1, 0],
          [0, sampleSize - 1],
          [sampleSize - 1, sampleSize - 1],
        ];
        for (const [x, y] of corners) {
          const idx = (y * sampleSize + x) * 4 + 3;
          if (data[idx] < 200) transparentPixels++;
        }
        // Also scan all pixels for any alpha < 255
        let anyAlpha = false;
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] < 250) {
            anyAlpha = true;
            break;
          }
        }
        resolve({
          width,
          height,
          hasTransparency: anyAlpha || transparentPixels >= 2,
          fileSize: 0,
          fileType: fileType || "image/png",
        });
      } catch {
        resolve({ width, height, hasTransparency: false, fileSize: 0, fileType: fileType || "image/png" });
      }
    };

    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export default function LogoUploader({
  logoUrl,
  primaryColor = "#E86C2C",
  uploading,
  onUpload,
  onRemove,
}: LogoUploaderProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [meta, setMeta] = useState<LogoMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Re-analyze whenever logoUrl changes
  useEffect(() => {
    if (!logoUrl) {
      setMeta(null);
      return;
    }
    setAnalyzing(true);
    detectImageMeta(logoUrl).then((m) => {
      setMeta(m);
      setAnalyzing(false);
    });
  }, [logoUrl]);

  const validateAndUpload = useCallback(
    async (file: File) => {
      setError(null);

      if (!file.type.startsWith("image/")) {
        setError(t("logo.upload.errorImageOnly"));
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB max`);
        return;
      }

      // Pre-check dimensions for raster types
      if (file.type !== "image/svg+xml") {
        const previewUrl = URL.createObjectURL(file);
        const m = await detectImageMeta(previewUrl, file.type);
        URL.revokeObjectURL(previewUrl);
        if (m && (m.width < MIN_DIMENSION || m.height < MIN_DIMENSION)) {
          setError(`Logo is te klein (${m.width}×${m.height}px). Minimaal ${MIN_DIMENSION}×${MIN_DIMENSION}px aanbevolen.`);
          return;
        }
      }

      await onUpload(file);
    },
    [onUpload, t]
  );

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    validateAndUpload(files[0]);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }

  // ---------- Render ----------
  if (!logoUrl) {
    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <motion.div
          onDragEnter={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          whileHover={{ scale: 1.005 }}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
            dragActive
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border hover:border-primary/50 bg-muted/30"
          )}
        >
          <div
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors",
              dragActive ? "bg-primary/15" : "bg-secondary"
            )}
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            ) : (
              <Upload className={cn("w-6 h-6", dragActive ? "text-primary" : "text-muted-foreground")} />
            )}
          </div>
          <p className="text-sm font-medium text-foreground">
            {uploading ? t("logo.upload.uploading") : dragActive ? t("logo.upload.drop") : t("logo.upload.pick")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("logo.upload.formatHelp", { min: String(MIN_DIMENSION) })}
          </p>
          <p className="text-xs text-muted-foreground/80 mt-2">
            {t("logo.upload.tip")}
          </p>

          {error && (
            <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-destructive">
              <AlertTriangle className="w-3.5 h-3.5" />
              {error}
            </div>
          )}
        </motion.div>
      </>
    );
  }

  // With logo: previews + meta + actions
  const isSmall = meta && (meta.width < MIN_DIMENSION || meta.height < MIN_DIMENSION);
  const noTransparency = meta && !meta.hasTransparency && meta.fileType !== "image/svg+xml";

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Three-up preview: light / dark / branded */}
      <div className="grid grid-cols-3 gap-2">
        <PreviewTile label={t("logo.preview.light")} bg="white" textColor="text-slate-500" logoUrl={logoUrl} />
        <PreviewTile label={t("logo.preview.dark")} bg="#0F172A" textColor="text-slate-300" logoUrl={logoUrl} />
        <PreviewTile label={t("logo.preview.brand")} bg={primaryColor} textColor="text-white/80" logoUrl={logoUrl} />
      </div>

      {/* Meta + warnings */}
      <AnimatePresence>
        {analyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            {t("logo.upload.analyzing")}
          </motion.div>
        )}

        {!analyzing && meta && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-2 text-xs"
          >
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-muted-foreground">
              <ImageIcon className="w-3 h-3" />
              {meta.width}×{meta.height}px
            </span>

            {meta.hasTransparency ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                {t("logo.upload.transparent")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3 h-3" />
                {t("logo.upload.noTransparency")}
              </span>
            )}

            {isSmall && (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3 h-3" />
                {t("logo.upload.lowRes")}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helpful suggestions */}
      {!analyzing && (noTransparency || isSmall) && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-foreground/80">
            {noTransparency && (
              <p>
                <strong>Tip:</strong> {t("logo.upload.tipTransparency")}
              </p>
            )}
            {isSmall && (
              <p className={noTransparency ? "mt-1" : ""}>
                <strong>Tip:</strong> {t("logo.upload.tipSize", { min: String(MIN_DIMENSION) })}
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertTriangle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="gap-2 text-xs"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {uploading ? t("logo.upload.uploadingShort") : t("logo.upload.replace")}
        </Button>
        <Button variant="ghost" size="sm" className="text-destructive gap-2 text-xs" onClick={onRemove}>
          <X className="w-3.5 h-3.5" />
          {t("logo.upload.remove")}
        </Button>
      </div>
    </div>
  );
}

function PreviewTile({
  label,
  bg,
  textColor,
  logoUrl,
}: {
  label: string;
  bg: string;
  textColor: string;
  logoUrl: string;
}) {
  return (
    <div
      className="rounded-lg border border-border overflow-hidden flex flex-col"
      style={{ background: bg }}
    >
      <div className="flex-1 flex items-center justify-center p-4 min-h-[88px]">
        <img
          src={logoUrl}
          alt={`Logo op ${label.toLowerCase()}`}
          className="max-h-[64px] max-w-full object-contain"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
      <div className={cn("text-xs font-medium text-center py-1.5", textColor)}>
        {label}
      </div>
    </div>
  );
}
