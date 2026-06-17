-- CreateEnum
CREATE TYPE "DiscoveryRunStatus" AS ENUM ('discovering', 'processing', 'completed', 'failed');

-- AlterEnum
ALTER TYPE "LeadStatus" ADD VALUE 'dedicated_sales';

-- AlterTable
ALTER TABLE "Audit" ADD COLUMN     "benchmarkGap" TEXT,
ADD COLUMN     "bestPracticeComparison" TEXT,
ADD COLUMN     "criticalFindingsJson" JSONB;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "discoveryCategory" TEXT,
ADD COLUMN     "discoverySourceId" TEXT;

-- CreateTable
CREATE TABLE "DiscoveryRun" (
    "id" TEXT NOT NULL,
    "workflowRunId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT,
    "industries" TEXT[],
    "targetCount" INTEGER NOT NULL,
    "status" "DiscoveryRunStatus" NOT NULL DEFAULT 'discovering',
    "leadIds" TEXT[],
    "placesFound" INTEGER NOT NULL DEFAULT 0,
    "imported" INTEGER NOT NULL DEFAULT 0,
    "skippedDuplicate" INTEGER NOT NULL DEFAULT 0,
    "skippedSuppressed" INTEGER NOT NULL DEFAULT 0,
    "dedicatedSalesCount" INTEGER NOT NULL DEFAULT 0,
    "prospectsCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DiscoveryRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscoveryRun_workflowRunId_key" ON "DiscoveryRun"("workflowRunId");

-- CreateIndex
CREATE INDEX "DiscoveryRun_createdAt_idx" ON "DiscoveryRun"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_discoverySourceId_key" ON "Lead"("discoverySourceId");

-- AddForeignKey
ALTER TABLE "DiscoveryRun" ADD CONSTRAINT "DiscoveryRun_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "WorkflowRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

