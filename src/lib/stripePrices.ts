// Centrale registry van Stripe price IDs (alle bedragen excl. 21% btw)
// Bestaande klanten blijven via grandfathering op de oude prijzen.

export const STRIPE_PLAN_PRICES = {
  basic: "price_1TOBmfL34Z8Db3WQ9eUi1gBU", // €24/mnd
  pro: "price_1TOBn8L34Z8Db3WQaLYUP3pK",   // €69/mnd
} as const;

export type AddonId = "ai_plus" | "extra_member" | "white_label_basic" | "extra_widget";

export interface AddonDefinition {
  id: AddonId;
  productId: string;
  priceId: string;
  name: string;
  pitch: string;
  priceLabel: string; // bv. "€15"
  priceSuffix: string; // bv. "/maand · excl. btw"
  badge?: string;
}

type T = (key: string, vars?: Record<string, string>) => string;

/** Build add-on registry uit de translation layer. Stripe IDs zijn universeel. */
export function getStripeAddons(t: T): Record<AddonId, AddonDefinition> {
  const monthlySuffix = t("plans.priceSuffixMonthlyExVat");
  return {
    ai_plus: {
      id: "ai_plus",
      productId: "prod_UMve0PMVP1jxdi",
      priceId: "price_1TOBnJL34Z8Db3WQSPHnEmi0",
      name: t("addons.aiPlus.name"),
      pitch: t("addons.aiPlus.pitch"),
      priceLabel: "€15",
      priceSuffix: monthlySuffix,
      badge: t("addons.aiPlus.badge"),
    },
    extra_member: {
      id: "extra_member",
      productId: "prod_UMveavWYexz88F",
      priceId: "price_1TOBnLL34Z8Db3WQFx5DR1fL",
      name: t("addons.extraMember.name"),
      pitch: t("addons.extraMember.pitch"),
      priceLabel: "€7",
      priceSuffix: t("addons.extraMember.suffix"),
    },
    white_label_basic: {
      id: "white_label_basic",
      productId: "prod_UMver5TjPfDdWI",
      priceId: "price_1TOBnNL34Z8Db3WQTWH2i5V3",
      name: t("addons.whiteLabel.name"),
      pitch: t("addons.whiteLabel.pitch"),
      priceLabel: "€12",
      priceSuffix: monthlySuffix,
    },
    extra_widget: {
      id: "extra_widget",
      productId: "prod_UMveDRXPjYGtoN",
      priceId: "price_1TOBnOL34Z8Db3WQwaPVtsKp",
      name: t("addons.extraWidget.name"),
      pitch: t("addons.extraWidget.pitch"),
      priceLabel: "€7",
      priceSuffix: monthlySuffix,
    },
  };
}

// LEGACY NL-only constant (backwards-compat)
export const STRIPE_ADDONS: Record<AddonId, AddonDefinition> = {
  ai_plus: {
    id: "ai_plus", productId: "prod_UMve0PMVP1jxdi", priceId: "price_1TOBnJL34Z8Db3WQSPHnEmi0",
    name: "AI Plus — extra volume",
    pitch: "Bovenop de AI-functies in je plan: extra AI-generaties, herschrijvingen en kanaalvarianten voor teams die intensief met AI werken.",
    priceLabel: "€15", priceSuffix: "/maand · excl. btw", badge: "Extra volume",
  },
  extra_member: {
    id: "extra_member", productId: "prod_UMveavWYexz88F", priceId: "price_1TOBnLL34Z8Db3WQFx5DR1fL",
    name: "Extra teamleden",
    pitch: "Voeg extra gebruikers toe aan je organisatie. Per gebruiker, per maand.",
    priceLabel: "€7", priceSuffix: "per gebruiker / maand · excl. btw",
  },
  white_label_basic: {
    id: "white_label_basic", productId: "prod_UMver5TjPfDdWI", priceId: "price_1TOBnNL34Z8Db3WQTWH2i5V3",
    name: "White Label voor Basic",
    pitch: "Verberg de TX EventShare branding op je publieke pagina's en widgets — zonder Pro upgrade.",
    priceLabel: "€12", priceSuffix: "/maand · excl. btw",
  },
  extra_widget: {
    id: "extra_widget", productId: "prod_UMveDRXPjYGtoN", priceId: "price_1TOBnOL34Z8Db3WQwaPVtsKp",
    name: "Extra widget / website",
    pitch: "Voor organisaties die op meerdere websites of locaties promoten.",
    priceLabel: "€7", priceSuffix: "/maand · excl. btw",
  },
};
