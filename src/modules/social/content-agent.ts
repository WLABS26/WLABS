/**
 * Social Content Agent.
 *
 * Generates a caption, hashtags, and DALL-E image description for a social
 * post. Starts from a hardcoded template per post type + platform (runs in
 * mock mode with no API key) and, if a real AI provider is configured, rewrites
 * the caption for tone, brevity, and platform-specific best practices.
 */
import { z } from "zod";

import { generateStructured } from "@/lib/ai/generate";
import { isMockProvider } from "@/lib/ai/provider";
import { Agent } from "@/modules/agents/base-agent";
import type { AgentExecuteContext } from "@/modules/agents/types";
import { CONTENT_AGENT_SYSTEM_PROMPT, HASHTAG_BANKS, POST_TEMPLATES } from "./constants";
import { socialContentInputSchema, socialContentOutputSchema } from "./types";
import type { SocialContentInput, SocialContentOutput } from "./types";

const aiRewriteSchema = z.object({
  caption: z.string(),
  hashtags: z.array(z.string()),
  imageDescription: z.string(),
});

export class SocialContentAgent extends Agent<SocialContentInput, SocialContentOutput> {
  readonly name = "social_content_agent";
  readonly description = "Generates a platform-specific caption and image description for a WLABS social post.";
  readonly inputSchema = socialContentInputSchema;
  readonly outputSchema = socialContentOutputSchema;

  protected async execute(input: SocialContentInput, ctx: AgentExecuteContext): Promise<SocialContentOutput> {
    const template = POST_TEMPLATES[input.postType][input.platform];
    const hashtags = HASHTAG_BANKS[input.postType].slice(0, input.platform === "instagram" ? 9 : 4);

    const draft: SocialContentOutput = {
      caption: template.caption,
      hashtags,
      imageDescription: template.imageDescription,
      postType: input.postType,
      platform: input.platform,
    };

    if (isMockProvider()) return draft;

    const contextNote = input.context?.industry
      ? `Industry context: ${input.context.industry}. ${input.context.businessName ? `Business: ${input.context.businessName}.` : ""}`
      : "";

    const rewrite = await generateStructured({
      system: CONTENT_AGENT_SYSTEM_PROMPT,
      prompt: `Platform: ${input.platform}
Post type: ${input.postType}
${contextNote}

Draft caption to rewrite:
${template.caption}

Current hashtags: ${hashtags.join(", ")}
Current image description: ${template.imageDescription}

Return improved JSON: { "caption": "...", "hashtags": ["..."], "imageDescription": "..." }`,
      schema: aiRewriteSchema,
    });

    if (!rewrite) {
      ctx.log("warn", "AI rewrite unavailable, using template output");
      return draft;
    }

    ctx.log("info", `AI rewrote ${input.postType} post for ${input.platform}`);
    return {
      ...draft,
      caption: rewrite.caption,
      hashtags: rewrite.hashtags,
      imageDescription: rewrite.imageDescription,
    };
  }
}

export const socialContentAgent = new SocialContentAgent();
