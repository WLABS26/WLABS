-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('imported', 'qualified', 'rejected', 'crawled', 'audited', 'high_opportunity', 'medium_opportunity', 'low_opportunity', 'preview_generated', 'preview_qc_passed', 'preview_needs_review', 'email_drafted', 'email_qc_passed', 'approved', 'contacted', 'replied', 'booked_call', 'won', 'lost', 'suppressed');

-- CreateEnum
CREATE TYPE "LeadQualification" AS ENUM ('ready_for_crawl', 'needs_manual_review', 'rejected');

-- CreateEnum
CREATE TYPE "OpportunityLevel" AS ENUM ('high_opportunity', 'medium_opportunity', 'low_opportunity', 'reject');

-- CreateEnum
CREATE TYPE "CrawlStatus" AS ENUM ('pending', 'success', 'failed', 'blocked', 'timeout', 'invalid_url');

-- CreateEnum
CREATE TYPE "QcStatus" AS ENUM ('passed', 'needs_review', 'failed');

-- CreateEnum
CREATE TYPE "PreviewStatus" AS ENUM ('draft', 'generated', 'needs_review', 'approved', 'published');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('draft', 'needs_review', 'do_not_send', 'approved', 'exported', 'sent', 'bounced', 'opted_out');

-- CreateEnum
CREATE TYPE "EmailVariant" AS ENUM ('direct_preview', 'audit_first', 'soft_consult', 'follow_up_1', 'follow_up_2', 'breakup');

-- CreateEnum
CREATE TYPE "InboundRequestStatus" AS ENUM ('new', 'processing', 'converted', 'closed');

-- CreateEnum
CREATE TYPE "WorkflowRunStatus" AS ENUM ('pending', 'running', 'waiting_for_approval', 'completed', 'failed', 'cancelled', 'paused');

-- CreateEnum
CREATE TYPE "AgentStepStatus" AS ENUM ('pending', 'running', 'completed', 'failed', 'skipped', 'waiting_for_approval', 'retrying');

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "city" TEXT,
    "country" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "contactPerson" TEXT,
    "source" TEXT,
    "sourceUrl" TEXT,
    "notes" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'imported',
    "qualificationStatus" "LeadQualification",
    "auditScore" INTEGER,
    "doNotContact" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteCapture" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "html" TEXT,
    "title" TEXT,
    "metaDescription" TEXT,
    "h1" TEXT,
    "extractedText" TEXT,
    "desktopScreenshotUrl" TEXT,
    "mobileScreenshotUrl" TEXT,
    "lighthouseJson" JSONB,
    "extractedDataJson" JSONB,
    "crawlStatus" "CrawlStatus" NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebsiteCapture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Audit" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "categoryScoresJson" JSONB NOT NULL,
    "topIssuesJson" JSONB NOT NULL,
    "quickWinsJson" JSONB NOT NULL,
    "recommendedPositioning" TEXT,
    "recommendedPageStructureJson" JSONB,
    "salesAngle" TEXT,
    "urgencyReason" TEXT,
    "redesignPotential" TEXT,
    "qualificationStatus" "OpportunityLevel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RedesignBrief" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "industry" TEXT,
    "businessSummary" TEXT,
    "targetCustomer" TEXT,
    "currentWeaknessesJson" JSONB,
    "redesignOpportunitiesJson" JSONB,
    "recommendedHeadline" TEXT,
    "recommendedSubheadline" TEXT,
    "suggestedCtasJson" JSONB,
    "recommendedSectionsJson" JSONB,
    "visualStyleDirection" TEXT,
    "credibilityElementsJson" JSONB,
    "localSeoAngle" TEXT,
    "beforeAfterNarrative" TEXT,
    "emailPitchAngle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RedesignBrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preview" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "token" TEXT,
    "status" "PreviewStatus" NOT NULL DEFAULT 'draft',
    "contentJson" JSONB NOT NULL,
    "themeJson" JSONB,
    "previewUrl" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "ctaClickCount" INTEGER NOT NULL DEFAULT 0,
    "qcStatus" "QcStatus",
    "qcIssuesJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Preview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailDraft" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "variant" "EmailVariant" NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'draft',
    "personalizationJson" JSONB,
    "complianceFlagsJson" JSONB,
    "qcStatus" "QcStatus",
    "qcIssuesJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suppression" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "websiteUrl" TEXT,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Suppression_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboundRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessName" TEXT,
    "websiteUrl" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "industry" TEXT,
    "message" TEXT,
    "status" "InboundRequestStatus" NOT NULL DEFAULT 'new',
    "leadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InboundRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowRun" (
    "id" TEXT NOT NULL,
    "workflowType" TEXT NOT NULL,
    "status" "WorkflowRunStatus" NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL,
    "workflowRunId" TEXT NOT NULL,
    "leadId" TEXT,
    "agentName" TEXT NOT NULL,
    "status" "AgentStepStatus" NOT NULL DEFAULT 'pending',
    "inputJson" JSONB,
    "outputJson" JSONB,
    "errorJson" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_slug_key" ON "Lead"("slug");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_industry_idx" ON "Lead"("industry");

-- CreateIndex
CREATE INDEX "Lead_websiteUrl_idx" ON "Lead"("websiteUrl");

-- CreateIndex
CREATE INDEX "Lead_contactEmail_idx" ON "Lead"("contactEmail");

-- CreateIndex
CREATE INDEX "Lead_qualificationStatus_idx" ON "Lead"("qualificationStatus");

-- CreateIndex
CREATE INDEX "WebsiteCapture_leadId_idx" ON "WebsiteCapture"("leadId");

-- CreateIndex
CREATE INDEX "Audit_leadId_idx" ON "Audit"("leadId");

-- CreateIndex
CREATE INDEX "RedesignBrief_leadId_idx" ON "RedesignBrief"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "Preview_slug_key" ON "Preview"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Preview_token_key" ON "Preview"("token");

-- CreateIndex
CREATE INDEX "Preview_leadId_idx" ON "Preview"("leadId");

-- CreateIndex
CREATE INDEX "Preview_status_idx" ON "Preview"("status");

-- CreateIndex
CREATE INDEX "EmailDraft_leadId_idx" ON "EmailDraft"("leadId");

-- CreateIndex
CREATE INDEX "EmailDraft_status_idx" ON "EmailDraft"("status");

-- CreateIndex
CREATE INDEX "EmailDraft_variant_idx" ON "EmailDraft"("variant");

-- CreateIndex
CREATE INDEX "Activity_leadId_idx" ON "Activity"("leadId");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- CreateIndex
CREATE INDEX "Suppression_email_idx" ON "Suppression"("email");

-- CreateIndex
CREATE INDEX "Suppression_websiteUrl_idx" ON "Suppression"("websiteUrl");

-- CreateIndex
CREATE INDEX "InboundRequest_status_idx" ON "InboundRequest"("status");

-- CreateIndex
CREATE INDEX "InboundRequest_email_idx" ON "InboundRequest"("email");

-- CreateIndex
CREATE INDEX "WorkflowRun_workflowType_idx" ON "WorkflowRun"("workflowType");

-- CreateIndex
CREATE INDEX "WorkflowRun_status_idx" ON "WorkflowRun"("status");

-- CreateIndex
CREATE INDEX "WorkflowStep_workflowRunId_idx" ON "WorkflowStep"("workflowRunId");

-- CreateIndex
CREATE INDEX "WorkflowStep_leadId_idx" ON "WorkflowStep"("leadId");

-- CreateIndex
CREATE INDEX "WorkflowStep_agentName_idx" ON "WorkflowStep"("agentName");

-- CreateIndex
CREATE INDEX "WorkflowStep_status_idx" ON "WorkflowStep"("status");

-- AddForeignKey
ALTER TABLE "WebsiteCapture" ADD CONSTRAINT "WebsiteCapture_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RedesignBrief" ADD CONSTRAINT "RedesignBrief_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preview" ADD CONSTRAINT "Preview_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDraft" ADD CONSTRAINT "EmailDraft_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundRequest" ADD CONSTRAINT "InboundRequest_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "WorkflowRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

