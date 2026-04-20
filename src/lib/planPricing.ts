// Centrale registry van plan-presentatie en upgrade-logica.
// Alle prijzen excl. 21% btw. Stripe price IDs staan in stripePrices.ts.
//
// Plan namen, taglines, highlights en bestFor worden via de translation layer
// opgehaald (t-functie). De legacy `planPresentation` constant blijft beschikbaar
// als NL-fallback voor plekken die nog niet via de hook werken.

import type { PlanId } from "@/lib/plans";

export interface PlanPresentation {
  id: PlanId;
  name: string;
  tagline: string;
  priceLabel: string; // bv. "€24"
  priceSuffix: string; // bv. "/maand · excl. btw"
  description: string;
  highlights: string[]; // 3-5 belangrijkste features
  bestFor: string;
}

type T = (key: string, vars?: Record<string, string>) => string;

/**
 * Bouw plan-presentatie uit de translation layer. Prijslabels (€24, €69) zijn
 * universeel — niet vertaald.
 */
export function getPlanPresentation(t: T): Record<PlanId, PlanPresentation> {
  return {
    free: {
      id: "free",
      name: t("plans.free.name"),
      tagline: t("plans.free.tagline"),
      priceLabel: "€0",
      priceSuffix: t("plans.priceSuffixMonthly"),
      description: t("plans.free.tagline"),
      highlights: [
        t("plans.free.h1"),
        t("plans.free.h2"),
        t("plans.free.h3"),
        t("plans.free.h4"),
      ],
      bestFor: t("plans.free.bestFor"),
    },
    basic: {
      id: "basic",
      name: t("plans.basic.name"),
      tagline: t("plans.basic.tagline"),
      priceLabel: "€24",
      priceSuffix: t("plans.priceSuffixMonthlyExVat"),
      description: t("plans.basic.tagline"),
      highlights: [
        t("plans.basic.h1"),
        t("plans.basic.h2"),
        t("plans.basic.h3"),
        t("plans.basic.h4"),
        t("plans.basic.h5"),
      ],
      bestFor: t("plans.basic.bestFor"),
    },
    pro: {
      id: "pro",
      name: t("plans.pro.name"),
      tagline: t("plans.pro.tagline"),
      priceLabel: "€69",
      priceSuffix: t("plans.priceSuffixMonthlyExVat"),
      description: t("plans.pro.tagline"),
      highlights: [
        t("plans.pro.h1"),
        t("plans.pro.h2"),
        t("plans.pro.h3"),
        t("plans.pro.h4"),
        t("plans.pro.h5"),
        t("plans.pro.h6"),
      ],
      bestFor: t("plans.pro.bestFor"),
    },
  };
}

/** Sterkste reden om van plan A → B te upgraden — vertaalbaar. */
export function getUpgradeReason(t: T): Record<"free-to-basic" | "basic-to-pro", string> {
  return {
    "free-to-basic": t("plans.upgradeReason.freeToBasic"),
    "basic-to-pro": t("plans.upgradeReason.basicToPro"),
  };
}

/** Welke add-ons zijn relevant voor welk plan? */
export const relevantAddOns: Record<PlanId, Array<"ai_plus" | "extra_member" | "white_label_basic" | "extra_widget">> = {
  free: [], // Free upgradet eerst naar Basic
  basic: ["ai_plus", "white_label_basic", "extra_member"],
  pro: ["ai_plus", "extra_member", "extra_widget"],
};

// ─── LEGACY (NL-only) ─────────────────────────────────────────────────────────
// Behouden voor backwards-compat met code die nog geen useTranslation heeft.
// Nieuwe code moet getPlanPresentation(t) / getUpgradeReason(t) gebruiken.

export const planPresentation: Record<PlanId, PlanPresentation> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Probeer en ervaar",
    priceLabel: "€0",
    priceSuffix: "/maand",
    description: "Maak kennis met TX EventShare. Ideaal om te testen.",
    highlights: ["3 actieve evenementen", "1 widget", "Standaard sjablonen", "Basis distributie"],
    bestFor: "Eenmalig event of kennismaking",
  },
  basic: {
    id: "basic",
    name: "Basic",
    tagline: "Voor regelmatige promotie",
    priceLabel: "€24",
    priceSuffix: "/maand · excl. btw",
    description: "Voor café's en horeca die structureel evenementen organiseren.",
    highlights: ["15 actieve evenementen", "3 widgets", "Eigen branding & kleuren", "Distributie hub", "Eigen categorieën"],
    bestFor: "Café's, restaurants en kleine locaties",
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "Volledig event-platform",
    priceLabel: "€69",
    priceSuffix: "/maand · excl. btw",
    description: "Voor organisaties die TX EventShare als centraal systeem gebruiken.",
    highlights: ["Onbeperkt evenementen & widgets", "Geavanceerde branding", "Multi-location support", "ClickWise CRM-integratie", "Geavanceerde analytics", "10 teamleden"],
    bestFor: "Festivals, multi-venue en professionele organisaties",
  },
};

export const upgradeReason: Record<"free-to-basic" | "basic-to-pro", string> = {
  "free-to-basic": "Meer evenementen, eigen branding en de complete distributie hub.",
  "basic-to-pro": "Onbeperkt schalen, ClickWise-integratie en multi-location.",
};
