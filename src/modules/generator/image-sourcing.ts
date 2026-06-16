/**
 * Hybrid image sourcing for preview pages.
 *
 * Priority: (1) scraped images from the prospect's own site; (2) DALL-E 3
 * generated images for slots where no suitable scraped image exists.
 * Returns null from DALL-E when OPENAI_API_KEY is not set (mock-safe).
 */
import { put } from "@vercel/blob";
import type { IndustryKey } from "@/modules/shared/types";

export interface SourcingResult {
  heroImageUrl: string | null;
  galleryImages: { url: string; alt: string }[];
  serviceImages: Map<string, string>;
}

const INDUSTRY_HERO_PROMPTS: Partial<Record<IndustryKey, string>> = {
  dentist: "Modern bright dental clinic reception area, white tones, clean surfaces, professional and welcoming, photorealistic --ar 16:9",
  physiotherapist: "Modern physiotherapy treatment room with natural light, professional equipment, recovery-focused atmosphere, photorealistic --ar 16:9",
  plumber: "Professional plumber installing a sleek modern bathroom fixture, high-quality workmanship, clean surroundings, photorealistic --ar 16:9",
  electrician: "Professional electrician at work in a modern home, safety equipment, clean wiring installation, photorealistic --ar 16:9",
  lawyer: "Elegant modern law office interior, floor-to-ceiling bookshelves, warm natural light, professional atmosphere, photorealistic --ar 16:9",
  accountant: "Bright modern accounting office, two professionals reviewing financial documents, clean minimalist design, photorealistic --ar 16:9",
  real_estate: "Stunning modern residential property exterior at golden hour, lush landscaping, professional architectural photography --ar 16:9",
  restaurant: "Beautifully plated gourmet dish on an elegant restaurant table with warm ambient lighting, professional food photography --ar 16:9",
  beauty_clinic: "Serene modern beauty clinic treatment room, clean white aesthetic, professional skincare equipment, calming atmosphere --ar 16:9",
  construction: "Professional construction team completing a modern building project, high-quality craftmanship visible, photorealistic --ar 16:9",
  other: "Modern professional business office, clean minimalist interior, natural light, successful company atmosphere, photorealistic --ar 16:9",
};

const INDUSTRY_SERVICE_PROMPTS: Partial<Record<IndustryKey, string>> = {
  dentist: "Close-up of a dentist performing a professional tooth cleaning, modern equipment, calming clinical setting, photorealistic --ar 1:1",
  physiotherapist: "Physiotherapist guiding a patient through a shoulder rehabilitation exercise, professional clinic, photorealistic --ar 1:1",
  plumber: "Plumber expertly fitting a copper pipe under a modern sink, professional tools, photorealistic --ar 1:1",
  electrician: "Electrician installing a smart home electrical panel, organized clean wiring, photorealistic --ar 1:1",
  lawyer: "Lawyer reviewing legal documents with a client across an office desk, professional consultation, photorealistic --ar 1:1",
  accountant: "Accountant presenting financial charts on a laptop to a business client, modern office, photorealistic --ar 1:1",
  real_estate: "Real estate agent handing over keys to happy new homeowners in front of a beautiful house, photorealistic --ar 1:1",
  restaurant: "Chef plating an exquisite dish in a professional open kitchen, culinary artistry, photorealistic --ar 1:1",
  beauty_clinic: "Skincare specialist applying professional facial treatment to a relaxed client, spa-like clinic, photorealistic --ar 1:1",
  construction: "Construction worker inspecting high-quality brickwork on a finished wall, skilled craftsmanship, photorealistic --ar 1:1",
  other: "Professional team having a productive business meeting in a modern conference room, photorealistic --ar 1:1",
};

async function generateImage(prompt: string, size: "1792x1024" | "1024x1024", id: string): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: "dall-e-3", prompt, size, quality: "standard", n: 1 }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { data?: { url?: string }[] };
    const openaiUrl = data.data?.[0]?.url;
    if (!openaiUrl) return null;
    if (process.env.VERCEL_BLOB_TOKEN) {
      try {
        const imgRes = await fetch(openaiUrl);
        if (!imgRes.ok) return openaiUrl;
        const blob = await imgRes.blob();
        const stored = await put(`previews/${id}-${Date.now()}.png`, blob, { access: "public", token: process.env.VERCEL_BLOB_TOKEN });
        return stored.url;
      } catch {
        return openaiUrl;
      }
    }
    return openaiUrl;
  } catch {
    return null;
  }
}

export async function sourcePreviewImages(
  imageUrls: string[],
  industry: string,
  businessName: string,
): Promise<SourcingResult> {
  const key = industry as IndustryKey;
  const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);

  // Sort scraped URLs: prefer larger-looking paths (jpgs/pngs with longer names tend to be real content images)
  const scraped = imageUrls.filter((u) => /\.(jpe?g|png|webp)/i.test(u));

  const heroImageUrl = scraped[0] ?? (await generateImage(INDUSTRY_HERO_PROMPTS[key] ?? INDUSTRY_HERO_PROMPTS.other!, "1792x1024", `${slug}-hero`));

  const galleryScraped = scraped.slice(1, 7);
  const galleryImages: { url: string; alt: string }[] =
    galleryScraped.length >= 3
      ? galleryScraped.map((url) => ({ url, alt: `${businessName} — photo` }))
      : [];

  const serviceImageUrl = scraped[galleryScraped.length + 1] ?? (await generateImage(INDUSTRY_SERVICE_PROMPTS[key] ?? INDUSTRY_SERVICE_PROMPTS.other!, "1024x1024", `${slug}-service`));
  const serviceImages = new Map<string, string>();
  if (serviceImageUrl) serviceImages.set("__first__", serviceImageUrl);

  return { heroImageUrl, galleryImages, serviceImages };
}
