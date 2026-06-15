/**
 * Structured AI generation helper.
 *
 * Wraps `AIProvider.complete()` with JSON extraction + zod validation. Returns
 * `null` whenever AI isn't configured (mock mode), the call fails, or the
 * response doesn't parse/validate - callers always fall back to their
 * deterministic template output in that case, so AI is a best-effort
 * enhancement layer, never a hard dependency.
 */
import type { ZodType } from "zod";

import { getAIProvider, isMockProvider } from "./provider";

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) return fenced[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) return text.slice(start, end + 1);

  return text.trim();
}

export async function generateStructured<T>(options: {
  system: string;
  prompt: string;
  schema: ZodType<T>;
  temperature?: number;
  maxTokens?: number;
}): Promise<T | null> {
  if (isMockProvider()) return null;

  try {
    const text = await getAIProvider().complete({
      system: options.system,
      prompt: options.prompt,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    });
    return options.schema.parse(JSON.parse(extractJson(text)));
  } catch {
    return null;
  }
}
