import { Palette } from "lucide-react";
import { useTranslation } from "@/hooks/useUILanguage";
import BrandingTab from "@/components/settings/BrandingTab";

export default function BrandSettingsPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <Palette className="w-6 h-6 text-primary" />
          {t("settings.section.brand")}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("settings.section.brand.desc")}</p>
      </div>
      <BrandingTab />
    </div>
  );
}