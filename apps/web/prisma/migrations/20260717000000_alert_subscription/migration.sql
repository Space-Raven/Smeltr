-- CreateTable: holder-milestone alert subscriptions (Phase D retention loop).
-- The only email↔wallet link in the schema; rows are DELETED on unsubscribe.
CREATE TABLE "AlertSubscription" (
    "id" TEXT NOT NULL,
    "chainId" TEXT NOT NULL,
    "mintAddress" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "verifyToken" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "unsubToken" TEXT NOT NULL,
    "lastMilestone" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AlertSubscription_verifyToken_key" ON "AlertSubscription"("verifyToken");
CREATE UNIQUE INDEX "AlertSubscription_unsubToken_key" ON "AlertSubscription"("unsubToken");
CREATE UNIQUE INDEX "AlertSubscription_chainId_mintAddress_email_key" ON "AlertSubscription"("chainId", "mintAddress", "email");
CREATE INDEX "AlertSubscription_verifiedAt_idx" ON "AlertSubscription"("verifiedAt");
