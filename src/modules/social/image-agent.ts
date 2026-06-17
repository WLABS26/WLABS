/**
 * DALL-E 3 image generation for social media posts.
 *
 * If VERCEL_BLOB_TOKEN is set, images are downloaded and stored permanently in
 * Vercel Blob so they can be used any time. If not, the raw OpenAI URL is
 * returned — valid for ~1 hour, sufficient for immediate posting.
 *
 * Returns null in mock mode (no OPENAI_API_KEY).
 */
import { put } from "@vercel/blob";

export async function generateSocialImage(description: string, platform: "instagram" | "linkedin"): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const size = platform === "linkedin" ? "1792x1024" : "1024x1024";

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: "dall-e-3", prompt: description, size, quality: "standard", n: 1 }),
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
        const fileName = `social/${Date.now()}-${platform}.png`;
        const stored = await put(fileName, blob, { access: "public", token: process.env.VERCEL_BLOB_TOKEN });
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
