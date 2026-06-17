"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { instagramAdapter } from "@/modules/social/instagram";
import { linkedInAdapter } from "@/modules/social/linkedin";
import { runSocialPostGeneration } from "@/modules/social/social-pipeline";

function revalidateSocial() {
  revalidatePath("/admin/social");
}

export async function generateSocialPostsAction(): Promise<void> {
  await runSocialPostGeneration({ createdBy: "admin_dashboard" });
  revalidateSocial();
}

export async function approveSocialPostAction(formData: FormData): Promise<void> {
  const postId = String(formData.get("postId"));
  await prisma.socialPost.update({ where: { id: postId }, data: { status: "approved" } });
  revalidateSocial();
}

export async function scheduleSocialPostAction(formData: FormData): Promise<void> {
  const postId = String(formData.get("postId"));
  const raw = String(formData.get("scheduledFor") ?? "");
  const scheduledFor = raw ? new Date(raw) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.socialPost.update({ where: { id: postId }, data: { status: "scheduled", scheduledFor } });
  revalidateSocial();
}

export async function publishSocialPostNowAction(formData: FormData): Promise<void> {
  const postId = String(formData.get("postId"));
  const post = await prisma.socialPost.findUnique({ where: { id: postId } });
  if (!post) return;

  try {
    const adapter = post.platform === "instagram" ? instagramAdapter : linkedInAdapter;
    const result = await adapter.publish({
      imageUrl: post.imageUrl ?? null,
      caption: post.caption,
      hashtags: post.hashtags,
    });
    await prisma.socialPost.update({
      where: { id: postId },
      data: { status: "posted", postedAt: new Date(), externalId: result.id, failureReason: null },
    });
  } catch (err) {
    await prisma.socialPost.update({
      where: { id: postId },
      data: { status: "failed", failureReason: String(err) },
    });
  }

  revalidateSocial();
}

export async function deleteSocialPostAction(formData: FormData): Promise<void> {
  const postId = String(formData.get("postId"));
  await prisma.socialPost.delete({ where: { id: postId } });
  revalidateSocial();
}
