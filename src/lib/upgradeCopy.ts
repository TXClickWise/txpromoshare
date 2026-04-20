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
    title: "Klaar voor meer events en eigen branding?",
    subtitle: "Basic geeft je 15 evenementen, 3 widgets en je eigen merkstijl — vanaf €24/mnd (excl. btw).",
    cta: "Bekijk Basic",
    targetPlan: "Basic",
  },
  "basic-to-pro": {
    title: "Schaal zonder limieten",
    subtitle: "Pro biedt onbeperkt events, multi-location en de ClickWise-integratie — €69/mnd (excl. btw).",
    cta: "Bekijk Pro",
    targetPlan: "Pro",
  },
  addon: {
    title: "Uitbreiden zonder van plan te wisselen",
    subtitle: "Voeg losse modules toe zoals AI Plus, white label of extra teamleden.",
    cta: "Bekijk add-ons",
    targetPlan: "Add-on",
  },
};
