/**
 * Curated stock imagery + design palettes per industry for wireframe generation.
 *
 * Every wireframe must look valuable, so it always carries real photography.
 * Resolution priority: (1) the prospect's own scraped images; (2) industry
 * stock photos (Unsplash CDN); (3) graceful gradient fallback via onerror in
 * the rendered HTML. DALL-E generated images (when configured) are merged in
 * upstream via the existing image-sourcing module.
 */
import type { IndustryKey } from "@/modules/shared/types";

/** Unsplash CDN helper — stable photo IDs, sized + cropped for the web. */
function u(id: string, w = 1100): string {
  return `https://images.unsplash.com/photo-${id}?w=${w}&q=75&auto=format&fit=crop`;
}

export interface IndustryStock {
  hero: string;
  philosophy: string;
  gallery: string[];
}

/**
 * Curated, on-theme stock photos per industry. The dentist set uses the exact
 * photos from the Dr. Becker reference design (verified valid).
 */
const INDUSTRY_STOCK: Record<IndustryKey, IndustryStock> = {
  dentist: {
    hero: u("1629909613654-28e377c37b09"),
    philosophy: u("1598256989800-fe5f95da9787"),
    gallery: [u("1588776814546-1ffcf47267a5"), u("1606811841689-23dfddce3e95"), u("1609840114035-3c981b782dfe")],
  },
  physiotherapist: {
    hero: u("1571019613454-1cb2f99b2d8b"),
    philosophy: u("1576091160550-2173dba999ef"),
    gallery: [u("1518611012118-696072aa579a"), u("1591258370814-01609b341790"), u("1612349317150-e413f6a5b16d")],
  },
  plumber: {
    hero: u("1607472586893-edb57bdc0e39"),
    philosophy: u("1585704032915-c3400ca199e7"),
    gallery: [u("1581244277943-fe4a9c777189"), u("1620626011761-996317b8d101"), u("1558618666-fcd25c85cd64")],
  },
  electrician: {
    hero: u("1621905251918-48416bd8575a"),
    philosophy: u("1565608438257-fac3c27beb36"),
    gallery: [u("1558618666-fcd25c85cd64"), u("1581092160562-40aa08e78837"), u("1521791136064-7986c2920216")],
  },
  lawyer: {
    hero: u("1505664194779-8beaceb93744"),
    philosophy: u("1589829545856-d10d557cf95f"),
    gallery: [u("1521791136064-7986c2920216"), u("1450101499163-c8848c66ca85"), u("1436450412740-6b988f486c6b")],
  },
  accountant: {
    hero: u("1554224155-6726b3ff858f"),
    philosophy: u("1551288049-bebda4e38f71"),
    gallery: [u("1460925895917-afdab827c52f"), u("1543286386-713bdd548da4"), u("1556742049-0cfed4f6a45d")],
  },
  real_estate: {
    hero: u("1564013799919-ab600027ffc6"),
    philosophy: u("1568605114967-8130f3a36994"),
    gallery: [u("1570129477492-45c003edd2be"), u("1512917774080-9991f1c4c750"), u("1502672260266-1c1ef2d93688")],
  },
  restaurant: {
    hero: u("1517248135467-4c7edcad34c4"),
    philosophy: u("1414235077428-338989a2e8c0"),
    gallery: [u("1555396273-367ea4eb4db5"), u("1504674900247-0877df9cc836"), u("1424847651672-bf20a4b0982b")],
  },
  beauty_clinic: {
    hero: u("1570172619644-dfd03ed5d881"),
    philosophy: u("1560750588-73207b1ef5b8"),
    gallery: [u("1487412947147-5cebf100ffc2"), u("1519014816548-bf5fe059798b"), u("1512290923902-8a9f81dc236c")],
  },
  construction: {
    hero: u("1541888946425-d81bb19240f5"),
    philosophy: u("1503387762-592deb58ef4e"),
    gallery: [u("1486406146926-c627a92ad1ab"), u("1504307651254-35680f356dfd"), u("1581094794329-c8112a89af12")],
  },
  other: {
    hero: u("1497366216548-37526070297c"),
    philosophy: u("1556761175-5973dc0f32e7"),
    gallery: [u("1497366754035-f200968a6e72"), u("1431540015161-0bf868a2d407"), u("1524758631624-e2822e304c36")],
  },
};

export function getIndustryStock(industry: string): IndustryStock {
  return INDUSTRY_STOCK[industry as IndustryKey] ?? INDUSTRY_STOCK.other;
}

export interface ResolvedWireframeImages {
  heroImageUrl: string;
  philosophyImageUrl: string;
  galleryImages: string[];
}

/**
 * Resolve the image set a wireframe should use. Scraped prospect images take
 * priority; industry stock fills any remaining slots so the layout is never
 * empty. Extra scraped images (DALL-E or site photos) flow into the gallery.
 */
export function resolveWireframeImages(scrapedImageUrls: string[], industry: string): ResolvedWireframeImages {
  const stock = getIndustryStock(industry);
  const scraped = scrapedImageUrls.filter((u) => /^https?:\/\//i.test(u) && /\.(jpe?g|png|webp|avif)/i.test(u));

  const heroImageUrl = scraped[0] ?? stock.hero;
  const philosophyImageUrl = scraped[1] ?? stock.philosophy;

  const remainingScraped = scraped.slice(2);
  const gallery = [...remainingScraped, ...stock.gallery].slice(0, 3);

  return { heroImageUrl, philosophyImageUrl, galleryImages: gallery };
}
