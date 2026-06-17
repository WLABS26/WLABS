-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('instagram', 'linkedin');

-- CreateEnum
CREATE TYPE "SocialPostStatus" AS ENUM ('draft', 'needs_review', 'approved', 'scheduled', 'posted', 'failed');

-- AlterTable
ALTER TABLE "Audit" ADD COLUMN     "visualAuditJson" JSONB,
ADD COLUMN     "visualScore" INTEGER;

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "postType" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "hashtags" TEXT[],
    "imageUrl" TEXT,
    "imagePrompt" TEXT,
    "status" "SocialPostStatus" NOT NULL DEFAULT 'draft',
    "scheduledFor" TIMESTAMP(3),
    "postedAt" TIMESTAMP(3),
    "externalId" TEXT,
    "failureReason" TEXT,
    "workflowRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialPost_platform_status_idx" ON "SocialPost"("platform", "status");

-- CreateIndex
CREATE INDEX "SocialPost_scheduledFor_idx" ON "SocialPost"("scheduledFor");
