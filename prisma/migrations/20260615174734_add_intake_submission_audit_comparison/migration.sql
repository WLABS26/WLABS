-- AlterEnum
ALTER TYPE "EmailVariant" ADD VALUE 'audit_comparison';

-- CreateTable
CREATE TABLE "IntakeSubmission" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "targetCustomer" TEXT,
    "brandColorsJson" JSONB,
    "preferredDomain" TEXT,
    "additionalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntakeSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IntakeSubmission_leadId_idx" ON "IntakeSubmission"("leadId");

-- AddForeignKey
ALTER TABLE "IntakeSubmission" ADD CONSTRAINT "IntakeSubmission_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
