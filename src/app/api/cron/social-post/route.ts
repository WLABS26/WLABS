/**
 * Daily cron: publish all SocialPost records whose scheduledFor <= now.
 *
 * Called by Vercel Cron at 09:00 UTC daily (configured in vercel.json).
 * Protected by CRON_SECRET to prevent unauthorized triggering.
 */
import { prisma } from "@/lib/prisma";
import { instagramAdapter } from "@/modules/social/instagram";
import { linkedInAdapter } from "@/modules/social/linkedin";

export async function GET(req: Request): Promise<Response> {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const due = await prisma.socialPost.findMany({
    where: { status: "scheduled", scheduledFor: { lte: new Date() } },
  });

  const results: Array<{ id: string; platform: string; ok: boolean; error?: string }> = [];

  for (const post of due) {
    try {
      const adapter = post.platform === "instagram" ? instagramAdapter : linkedInAdapter;
      const result = await adapter.publish({
        imageUrl: post.imageUrl ?? null,
        caption: post.caption,
        hashtags: post.hashtags,
      });
      await prisma.socialPost.update({
        where: { id: post.id },
        data: { status: "posted", postedAt: new Date(), externalId: result.id, failureReason: null },
      });
      results.push({ id: post.id, platform: post.platform, ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await prisma.socialPost.update({
        where: { id: post.id },
        data: { status: "failed", failureReason: message },
      });
      results.push({ id: post.id, platform: post.platform, ok: false, error: message });
    }
  }

  return Response.json({ published: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results });
}
