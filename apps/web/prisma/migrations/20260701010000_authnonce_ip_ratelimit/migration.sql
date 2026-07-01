-- AlterTable
ALTER TABLE "AuthNonce" ADD COLUMN "ip" TEXT;

-- CreateIndex
CREATE INDEX "AuthNonce_ip_createdAt_idx" ON "AuthNonce"("ip", "createdAt");
