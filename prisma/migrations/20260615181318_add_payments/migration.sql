-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('unpaid', 'pending', 'paid', 'refunded');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'unpaid',
ADD COLUMN     "stripeCheckoutSessionId" TEXT,
ADD COLUMN     "stripeCustomerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Lead_stripeCheckoutSessionId_key" ON "Lead"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "Lead_paymentStatus_idx" ON "Lead"("paymentStatus");
