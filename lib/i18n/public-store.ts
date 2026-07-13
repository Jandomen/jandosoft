import { getTranslation, type Language } from "./translations";

export type IndustryCTA =
  | "view_products"
  | "view_menu"
  | "view_services"
  | "book_appointment"
  | "view_courses"
  | "view_plans"
  | "view_rooms"
  | "view_packages"
  | "view_portfolio"
  | "view_projects";

const INDUSTRY_CTA_MAP: Record<string, { type: IndustryCTA; link: string }> = {
  restaurant:   { type: "view_menu",     link: "/products" },
  clinic:       { type: "book_appointment", link: "/reservar" },
  veterinary:   { type: "book_appointment", link: "/reservar" },
  dentist:      { type: "book_appointment", link: "/reservar" },
  school:       { type: "view_courses",   link: "/services" },
  gym:          { type: "view_plans",     link: "/services" },
  hotel:        { type: "view_rooms",     link: "/products" },
  events:       { type: "view_packages",  link: "/services" },
  photographer: { type: "view_portfolio", link: "/products" },
  construction: { type: "view_projects",  link: "/services" },
  store:        { type: "view_products",  link: "/products" },
  realestate:   { type: "view_products",  link: "/products" },
  general:      { type: "view_products",  link: "/products" },
};

export function getIndustryCTA(category: string): { type: IndustryCTA; link: string } {
  return INDUSTRY_CTA_MAP[category] || { type: "view_services", link: "/services" };
}

export function getCTATranslation(locale: Language, type: IndustryCTA): string {
  const key = `public.cta_${type}`;
  return getTranslation(locale, key);
}

export interface PublicPageTranslations {
  notFoundTitle: string;
  metaDesc: (name: string) => string;
  navHome: string;
  navProducts: string;
  navServices: string;
  heroSince: (date: string) => string;
  heroPrimaryCta: string;
  heroSecondaryBook: string;
  heroSecondaryContact: string;
  aiTitle: (name: string) => string;
  aiSubtitle: string;
  aiSuggestOfferings: string;
  aiSuggestHours: string;
  aiSuggestContact: string;
  aiSuggestLocation: string;
  sectionTestimonials: string;
  sectionGallery: string;
  sectionMenu: string;
  suspendedTitle: string;
  suspendedDefaultReason: string;
  suspendedBackHome: string;
  contactTitle: (name: string) => string;
  contactEmail: string;
  footerPoweredBy: string;
  getCTA: (type: IndustryCTA) => string;
}

export function getPublicPageTranslations(locale: Language): PublicPageTranslations {
  const t = (key: string) => getTranslation(locale, key);

  return {
    notFoundTitle: t("public.not_found_title"),
    metaDesc: (name: string) => t("public.meta_desc").replace("{name}", name),
    navHome: t("public.nav_home"),
    navProducts: t("public.nav_products"),
    navServices: t("public.nav_services"),
    heroSince: (date: string) => t("public.hero_since").replace("{date}", date),
    heroPrimaryCta: t("public.hero_primary_cta"),
    heroSecondaryBook: t("public.hero_secondary_book"),
    heroSecondaryContact: t("public.hero_secondary_contact"),
    aiTitle: (name: string) => t("public.ai_title").replace("{name}", name),
    aiSubtitle: t("public.ai_subtitle"),
    aiSuggestOfferings: t("public.ai_suggest_offerings"),
    aiSuggestHours: t("public.ai_suggest_hours"),
    aiSuggestContact: t("public.ai_suggest_contact"),
    aiSuggestLocation: t("public.ai_suggest_location"),
    sectionTestimonials: t("public.section_testimonials"),
    sectionGallery: t("public.section_gallery"),
    sectionMenu: t("public.section_menu"),
    suspendedTitle: t("public.suspended_title"),
    suspendedDefaultReason: t("public.suspended_default_reason"),
    suspendedBackHome: t("public.suspended_back_home"),
    contactTitle: (name: string) => t("public.contact_title").replace("{name}", name),
    contactEmail: t("public.contact_email"),
    footerPoweredBy: t("public.footer_powered_by"),
    getCTA: (type: IndustryCTA) => getCTATranslation(locale, type),
  };
}
