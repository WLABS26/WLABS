import type { Metadata } from "next";
import { Calendar, CheckCircle2, Clock, ImageIcon, RefreshCw, Send, Share2, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { SocialPlatform, SocialPostStatus } from "@/modules/social/types";

import {
  approveSocialPostAction,
  deleteSocialPostAction,
  generateSocialPostsAction,
  publishSocialPostNowAction,
  scheduleSocialPostAction,
} from "./actions";

export const metadata: Metadata = { title: "Social Media" };

export const dynamic = "force-dynamic";

const STATUS_VARIANTS: Record<SocialPostStatus, "default" | "success" | "warning" | "destructive" | "outline"> = {
  draft: "default",
  needs_review: "warning",
  approved: "outline",
  scheduled: "outline",
  posted: "success",
  failed: "destructive",
};

interface SocialPageProps {
  searchParams: Promise<{ platform?: string; status?: string }>;
}

export default async function SocialPage({ searchParams }: SocialPageProps) {
  const { platform: platformFilter, status: statusFilter } = await searchParams;

  const posts = await prisma.socialPost.findMany({
    where: {
      ...(platformFilter && platformFilter !== "all" ? { platform: platformFilter as SocialPlatform } : {}),
      ...(statusFilter && statusFilter !== "all" ? { status: statusFilter as SocialPostStatus } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const igCount = posts.filter((p) => p.platform === "instagram").length;
  const liCount = posts.filter((p) => p.platform === "linkedin").length;
  const pendingCount = posts.filter((p) => p.status === "needs_review" || p.status === "approved").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Social Media</h1>
          <p className="mt-1 text-sm text-muted">WLABS brand content — Instagram &amp; LinkedIn</p>
        </div>
        <form action={generateSocialPostsAction}>
          <Button type="submit">
            <RefreshCw className="size-4" />
            Generate new posts
          </Button>
        </form>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={posts.length} />
        <StatCard label="Instagram" value={igCount} />
        <StatCard label="LinkedIn" value={liCount} />
        <StatCard label="Pending" value={pendingCount} highlight={pendingCount > 0} />
      </div>

      {/* Setup notice */}
      {!process.env.INSTAGRAM_ACCESS_TOKEN && !process.env.LINKEDIN_ACCESS_TOKEN && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-300">
          <strong>Setup required:</strong> Configure{" "}
          <code className="rounded bg-amber-500/10 px-1">INSTAGRAM_ACCESS_TOKEN</code> and{" "}
          <code className="rounded bg-amber-500/10 px-1">LINKEDIN_ACCESS_TOKEN</code> to enable publishing.
          Posts can still be drafted and approved now — posting will work once credentials are set.
        </div>
      )}

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { href: "/admin/social", label: "All" },
          { href: "/admin/social?platform=instagram", label: "Instagram" },
          { href: "/admin/social?platform=linkedin", label: "LinkedIn" },
          { href: "/admin/social?status=needs_review", label: "Needs review" },
          { href: "/admin/social?status=approved", label: "Approved" },
          { href: "/admin/social?status=scheduled", label: "Scheduled" },
          { href: "/admin/social?status=posted", label: "Posted" },
        ].map(({ href, label }) => (
          <a
            key={href}
            href={href}
            className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-white/30 hover:text-white"
          >
            {label}
          </a>
        ))}
      </div>

      {/* Post list */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted">
            <Share2 className="mx-auto mb-3 size-8 opacity-30" />
            <p>No posts yet. Click &ldquo;Generate new posts&rdquo; to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="pt-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {/* Image thumbnail */}
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted overflow-hidden">
                    {post.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.imageUrl} alt="Post preview" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="size-6" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2 min-w-0">
                    {/* Header row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs font-medium capitalize text-white">
                        {post.platform}
                      </span>
                      <Badge variant="outline">{post.postType.replace(/_/g, " ")}</Badge>
                      <Badge variant={STATUS_VARIANTS[post.status as SocialPostStatus]}>{post.status.replace(/_/g, " ")}</Badge>
                      <span className="ml-auto text-xs text-muted shrink-0">{formatRelativeTime(post.createdAt)}</span>
                    </div>

                    {/* Caption preview */}
                    <p className="line-clamp-3 text-sm text-white">{post.caption}</p>

                    {/* Hashtags */}
                    {post.hashtags.length > 0 && (
                      <p className="truncate text-xs text-brand-cyan">
                        {post.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}
                      </p>
                    )}

                    {/* Scheduled time */}
                    {post.scheduledFor && post.status === "scheduled" && (
                      <p className="flex items-center gap-1.5 text-xs text-muted">
                        <Clock className="size-3.5" />
                        Scheduled for {formatDateTime(post.scheduledFor)}
                      </p>
                    )}

                    {/* Posted confirmation */}
                    {post.postedAt && (
                      <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <CheckCircle2 className="size-3.5" />
                        Posted {formatRelativeTime(post.postedAt)}
                        {post.externalId && <span className="text-muted">· {post.externalId}</span>}
                      </p>
                    )}

                    {/* Failure reason */}
                    {post.status === "failed" && post.failureReason && (
                      <p className="text-xs text-red-400">{post.failureReason}</p>
                    )}

                    {/* Actions */}
                    {post.status !== "posted" && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {post.status === "needs_review" && (
                          <form action={approveSocialPostAction}>
                            <input type="hidden" name="postId" value={post.id} />
                            <Button type="submit" size="sm" variant="subtle">
                              <CheckCircle2 className="size-3.5" />
                              Approve
                            </Button>
                          </form>
                        )}

                        {(post.status === "approved" || post.status === "scheduled") && (
                          <form action={publishSocialPostNowAction}>
                            <input type="hidden" name="postId" value={post.id} />
                            <Button type="submit" size="sm">
                              <Send className="size-3.5" />
                              Post now
                            </Button>
                          </form>
                        )}

                        {post.status === "approved" && (
                          <form action={scheduleSocialPostAction} className="flex items-center gap-2">
                            <input type="hidden" name="postId" value={post.id} />
                            <input
                              type="datetime-local"
                              name="scheduledFor"
                              className="h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white"
                            />
                            <Button type="submit" size="sm" variant="outline">
                              <Calendar className="size-3.5" />
                              Schedule
                            </Button>
                          </form>
                        )}

                        <form action={deleteSocialPostAction}>
                          <input type="hidden" name="postId" value={post.id} />
                          <Button type="submit" size="sm" variant="ghost" className="text-red-400 hover:text-red-300">
                            <Trash2 className="size-3.5" />
                          </Button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${highlight ? "text-amber-400" : "text-white"}`}>{value}</p>
    </div>
  );
}
