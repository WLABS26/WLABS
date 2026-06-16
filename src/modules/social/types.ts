import { z } from "zod";

export type SocialPlatform = "instagram" | "linkedin";
export type SocialPostType = "tip" | "service_promo" | "industry_spotlight" | "stat" | "general_brand";
export type SocialPostStatus = "draft" | "needs_review" | "approved" | "scheduled" | "posted" | "failed";

export const SOCIAL_PLATFORMS: SocialPlatform[] = ["instagram", "linkedin"];
export const SOCIAL_POST_TYPES: SocialPostType[] = ["tip", "service_promo", "industry_spotlight", "stat", "general_brand"];

export const socialContentInputSchema = z.object({
  postType: z.enum(["tip", "service_promo", "industry_spotlight", "stat", "general_brand"]),
  platform: z.enum(["instagram", "linkedin"]),
  context: z
    .object({
      industry: z.string().optional(),
      businessName: z.string().optional(),
    })
    .optional(),
});

export const socialContentOutputSchema = z.object({
  caption: z.string(),
  hashtags: z.array(z.string()),
  imageDescription: z.string(),
  postType: z.enum(["tip", "service_promo", "industry_spotlight", "stat", "general_brand"]),
  platform: z.enum(["instagram", "linkedin"]),
});

export type SocialContentInput = z.infer<typeof socialContentInputSchema>;
export type SocialContentOutput = z.infer<typeof socialContentOutputSchema>;
