// Herbruikbare upgrade-copy voor in-app prompts (UpgradeBanner, PlanGate, etc.)

export type UpgradeVariant = "free-to-basic" | "basic-to-pro" | "addon";

export interface UpgradeCopy {
  title: string;
  subtitle: string;
  cta: string;
  targetPlan: "Basic" | "Pro" | "Add-on";
}

export const upgradeCopy: Record<UpgradeVariant, UpgradeCopy> = {
  "free-to-basic": {
    title: "Meer events. Meer widgets. Meer grip op je promotie.",
    subtitle: "Upgrade naar Basic vanaf €24/mnd (excl. btw) en haal écht meer uit TX EventShare.",
    cta: "Start met Basic",
    targetPlan: "Basic",
  },
  "basic-to-pro": {
    title: "Klaar om TX EventShare als centraal systeem te gebruiken?",
    subtitle: "Pro geeft je onbeperkt evenementen, geavanceerde branding en multi-location voor €69/mnd (excl. btw).",
    cta: "Kies Pro",
    targetPlan: "Pro",
  },
  addon: {
    title: "Haal meer uit TX EventShare",
    subtitle: "Breid je plan uit met add-ons zoals AI Plus, extra teamleden of white label.",
    cta: "Bekijk add-ons",
    targetPlan: "Add-on",
  },
};
