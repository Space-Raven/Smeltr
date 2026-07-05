-- AlterTable: curation/review fields for the "Created on Smeltr" explorer
ALTER TABLE "Deployment" ADD COLUMN "reviewStatus" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "Deployment" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Deployment" ADD COLUMN "reviewNote" TEXT;

-- CreateIndex: powers the weekly review-queue query (status + recency)
CREATE INDEX "Deployment_reviewStatus_createdAt_idx" ON "Deployment"("reviewStatus", "createdAt");
