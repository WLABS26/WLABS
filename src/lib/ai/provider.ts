/**
 * AI provider abstraction.
 *
 * WLABS generators (redesign brief, preview copy, emails) are deterministic and
 * template-based by default (AI_PROVIDER="mock") so the whole system runs
 * locally with no API keys. When a real provider is configured, the same
 * `complete()` contract calls OpenAI- or Anthropic-compatible chat APIs. This
 * keeps the agents provider-agnostic.
 */

export type AIProviderName = "mock" | "openai" | "anthropic";

export interface AICompleteOptions {
  system?: string;
  prompt: string;
  /** Lower = more deterministic. */
  temperature?: number;
  maxTokens?: number;
  /** Override the provider's default model for this call. */
  model?: string;
}

export interface AIProvider {
  readonly name: AIProviderName;
  /** Returns the model's text completion for the given prompt. */
  complete(options: AICompleteOptions): Promise<string>;
}

/**
 * Deterministic provider used by default. It does not fabricate content - the
 * generators supply their own template output - so in mock mode `complete()`
 * simply echoes a marker the caller can detect and ignore.
 */
class MockProvider implements AIProvider {
  readonly name = "mock" as const;
  async complete(): Promise<string> {
    return "__MOCK__";
  }
}

class OpenAIProvider implements AIProvider {
  readonly name = "openai" as const;
  constructor(
    private apiKey: string,
    private model = "gpt-4o-mini",
  ) {}

  async complete(options: AICompleteOptions): Promise<string> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: options.model ?? this.model,
        temperature: options.temperature ?? 0.4,
        max_tokens: options.maxTokens ?? 1200,
        messages: [
          ...(options.system ? [{ role: "system", content: options.system }] : []),
          { role: "user", content: options.prompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content ?? "";
  }
}

class AnthropicProvider implements AIProvider {
  readonly name = "anthropic" as const;
  constructor(
    private apiKey: string,
    private model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
  ) {}

  async complete(options: AICompleteOptions): Promise<string> {
    const baseUrl = process.env.ANTHROPIC_BASE_URL?.replace(/\/$/, "") ?? "https://api.anthropic.com";
    const res = await fetch(`${baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: options.model ?? this.model,
        max_tokens: options.maxTokens ?? 1200,
        temperature: options.temperature ?? 0.4,
        ...(options.system ? { system: options.system } : {}),
        messages: [{ role: "user", content: options.prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { content?: { text?: string }[] };
    return data.content?.[0]?.text ?? "";
  }
}

let cached: AIProvider | undefined;

/** Resolve the configured AI provider (defaults to the deterministic mock). */
export function getAIProvider(): AIProvider {
  if (cached) return cached;
  const provider = (process.env.AI_PROVIDER as AIProviderName) || "mock";

  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    cached = new OpenAIProvider(process.env.OPENAI_API_KEY);
  } else if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    cached = new AnthropicProvider(process.env.ANTHROPIC_API_KEY);
  } else {
    cached = new MockProvider();
  }
  return cached;
}

export function isMockProvider(): boolean {
  return getAIProvider().name === "mock";
}
