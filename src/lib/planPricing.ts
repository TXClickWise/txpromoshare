// Centrale registry van plan-presentatie en upgrade-logica.
// Alle prijzen excl. 21% btw. Stripe price IDs staan in stripePrices.ts.

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

export const planPresentation: Record<PlanId, PlanPresentation> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Probeer en ervaar",
    priceLabel: "€0",
    priceSuffix: "/maand",
    description: "Maak kennis met TX EventShare. Ideaal om te testen.",
    highlights: [
      "3 actieve evenementen",
      "1 widget",
      "Standaard sjablonen",
      "Basis distributie",
    ],
    bestFor: "Eenmalig event of kennismaking",
  },
  basic: {
    id: "basic",
    name: "Basic",
    tagline: "Voor regelmatige promotie",
    priceLabel: "€24",
    priceSuffix: "/maand · excl. btw",
    description: "Voor café's en horeca die structureel evenementen organiseren.",
    highlights: [
      "15 actieve evenementen",
      "3 widgets",
      "Eigen branding & kleuren",
      "Distributie hub",
      "Eigen categorieën",
    ],
    bestFor: "Café's, restaurants en kleine locaties",
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "Volledig event-platform",
    priceLabel: "€69",
    priceSuffix: "/maand · excl. btw",
    description: "Voor organisaties die TX EventShare als centraal systeem gebruiken.",
    highlights: [
      "Onbeperkt evenementen & widgets",
      "Geavanceerde branding",
      "Multi-location support",
      "ClickWise CRM-integratie",
      "Geavanceerde analytics",
      "10 teamleden",
    ],
    bestFor: "Festivals, multi-venue en professionele organisaties",
  },
};

/** Sterkste reden om van plan A → B te upgraden. */
export const upgradeReason: Record<"free-to-basic" | "basic-to-pro", string> = {
  "free-to-basic": "Meer evenementen, eigen branding en de complete distributie hub.",
  "basic-to-pro": "Onbeperkt schalen, ClickWise-integratie en multi-location.",
};

/** Welke add-ons zijn relevant voor welk plan? */
export const relevantAddOns: Record<PlanId, Array<"ai_plus" | "extra_member" | "white_label_basic" | "extra_widget">> = {
  free: [], // Free upgradet eerst naar Basic
  basic: ["ai_plus", "white_label_basic", "extra_member"],
  pro: ["ai_plus", "extra_member", "extra_widget"],
};
