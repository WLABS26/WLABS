/**
 * Multimodal AI generation helper.
 *
 * Wraps vision-capable APIs (Anthropic + OpenAI) behind the same interface as
 * generateStructured(), adding an imageUrl parameter. Returns null whenever AI
 * isn't configured, the call fails, or the response doesn't validate — callers
 * always fall back to template output.
 */
import type { ZodType } from "zod";

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

async function callAnthropicVision(system: string, prompt: string, imageUrl: string, maxTokens: number): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "url", url: imageUrl } },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic vision error ${res.status}`);
  const data = (await res.json()) as { content?: { text?: string }[] };
  return data.content?.[0]?.text ?? "";
}

async function callOpenAIVision(system: string, prompt: string, imageUrl: string, maxTokens: number): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageUrl } },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI vision error ${res.status}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

export async function generateWithVision<T>(options: {
  system: string;
  prompt: string;
  imageUrl: string;
  schema: ZodType<T>;
  maxTokens?: number;
}): Promise<T | null> {
  const { system, prompt, imageUrl, schema, maxTokens = 1200 } = options;
  const provider = (process.env.AI_PROVIDER as string) || "mock";

  try {
    let text: string;
    if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
      text = await callAnthropicVision(system, prompt, imageUrl, maxTokens);
    } else if (provider === "openai" && process.env.OPENAI_API_KEY) {
      text = await callOpenAIVision(system, prompt, imageUrl, maxTokens);
    } else {
      return null;
    }
    return schema.parse(JSON.parse(extractJson(text)));
  } catch {
    return null;
  }
}
