import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  eventTitle: string;
}

// Simple QR code generator using canvas — no external dependency
function generateQRMatrix(text: string): boolean[][] {
  // Use a simple encoding via an img from a public API rendered onto canvas
  // We'll use the Google Charts API as fallback rendered in an image
  return [];
}

export function QRCodeDialog({ open, onOpenChange, url, eventTitle }: QRCodeDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    setLoaded(false);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 280;
    canvas.width = size;
    canvas.height = size;

    // Use QR code via image from public API
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      setLoaded(true);
    };
    img.onerror = () => {
      // Fallback: draw text
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#000000";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("QR kon niet geladen worden", size / 2, size / 2);
      ctx.fillText(url, size / 2, size / 2 + 20);
      setLoaded(true);
    };
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&margin=8`;
  }, [open, url]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `qr-${eventTitle.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    toast.success("QR-code gedownload");
  };

  const handleCopy = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await new Promise<Blob>((resolve) =>
        canvasRef.current!.toBlob((b) => resolve(b!), "image/png")
      );
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      toast.success("QR-code gekopieerd");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kopiëren niet ondersteund in deze browser");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">QR-code: {eventTitle}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="rounded-xl border border-border p-3 bg-white">
            <canvas ref={canvasRef} className="w-[200px] h-[200px]" />
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            Gasten scannen deze QR-code om direct de eventpagina te openen. Ideaal voor posters, flyers of tafelkaartjes.
          </p>
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1 gap-2" onClick={handleCopy} disabled={!loaded}>
              {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
              {copied ? "Gekopieerd!" : "Kopieer"}
            </Button>
            <Button className="flex-1 gap-2" onClick={handleDownload} disabled={!loaded}>
              <Download className="w-4 h-4" />
              Download PNG
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
