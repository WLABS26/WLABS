import { z } from "zod";

import { INDUSTRIES } from "@/modules/shared/constants";

const industryValues = INDUSTRIES.map((i) => i.value) as [string, ...string[]];

/**
 * Website preview request form (homepage / contact page CTA).
 * This is the primary inbound lead capture mechanism.
 */
export const previewRequestSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  businessName: z.string().trim().min(2, "Please enter your business name").max(160),
  websiteUrl: z
    .string()
    .trim()
    .min(3, "Please enter your website URL")
    .max(300)
    .transform((val) => (/^https?:\/\//i.test(val) ? val : `https://${val}`))
    .pipe(z.string().url("Please enter a valid website URL")),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(160),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  industry: z.enum(industryValues, { message: "Please select an industry" }),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type PreviewRequestInput = z.infer<typeof previewRequestSchema>;

/**
 * General contact form (Contact / Book Call page).
 * Website and industry are optional here since not every contact is a
 * preview request.
 */
export const contactRequestSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  businessName: z.string().trim().max(160).optional().or(z.literal("")),
  websiteUrl: z.string().trim().max(300).optional().or(z.literal("")),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(160),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  industry: z.enum(industryValues).optional(),
  message: z.string().trim().min(5, "Please add a short message").max(2000),
});

export type ContactRequestInput = z.infer<typeof contactRequestSchema>;
