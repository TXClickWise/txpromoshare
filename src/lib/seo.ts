import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const BASE_URL = "https://txpromoshare.nl";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-default.png`;
const SITE_NAME = "TX PromoShare";

export function useSEO({
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = "website",
  noindex = false,
  jsonLd,
}: SEOProps) {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    setMeta("description", description);
    setMeta("robots", noindex ? "noindex,nofollow" : "index,follow");

    setMeta("og:title", ogTitle || fullTitle, "property");
    setMeta("og:description", ogDescription || description, "property");
    setMeta("og:type", ogType, "property");
    setMeta("og:image", ogImage || DEFAULT_OG_IMAGE, "property");
    setMeta("og:site_name", SITE_NAME, "property");
    setMeta("og:locale", "nl_NL", "property");

    setMeta("twitter:card", "summary_large_image", "name");
    setMeta("twitter:title", ogTitle || fullTitle, "name");
    setMeta("twitter:description", ogDescription || description, "name");
    setMeta("twitter:image", ogImage || DEFAULT_OG_IMAGE, "name");

    // Canonical
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : undefined;
    if (canonicalUrl) {
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = canonicalUrl;
    } else if (link) {
      link.remove();
    }

    // JSON-LD
    const existing = document.querySelectorAll('script[data-seo-jsonld]');
    existing.forEach((el) => el.remove());

    const schemas = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
    schemas.forEach((schema) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo-jsonld", "true");
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      document.querySelectorAll('script[data-seo-jsonld]').forEach((el) => el.remove());
    };
  }, [title, description, canonical, ogTitle, ogDescription, ogImage, ogType, noindex, jsonLd]);
}

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

// Structured data helpers
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TX PromoShare",
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  description: "Event promotie software voor horeca, venues en eventorganisaties in Nederland.",
  foundingDate: "2025",
  sameAs: [],
  address: {
    "@type": "PostalAddress",
    addressCountry: "NL",
  },
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "TX PromoShare",
  url: BASE_URL,
  description: "Het slimste event promotie platform voor kleinere evenementen.",
  inLanguage: "nl",
  potentialAction: {
    "@type": "SearchAction",
    target: `${BASE_URL}/zoeken?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TX PromoShare",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: "Event promotie en agenda software voor horeca, venues, eventorganisaties en festivalorganisaties. Maak je event één keer aan en verspreid het overal.",
  url: BASE_URL,
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "EUR",
      description: "Gratis starten met event promotie",
    },
    {
      "@type": "Offer",
      name: "Basic",
      price: "29",
      priceCurrency: "EUR",
      priceSpecification: { "@type": "UnitPriceSpecification", billingDuration: "P1M" },
      description: "Voor professionele event promotie",
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "79",
      priceCurrency: "EUR",
      priceSpecification: { "@type": "UnitPriceSpecification", billingDuration: "P1M" },
      description: "Volledig pakket met integraties",
    },
  ],
};

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  };
}
