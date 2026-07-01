-- CreateTable
CREATE TABLE "UploadUsage" (
    "walletAddress" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "requests" INTEGER NOT NULL DEFAULT 0,
    "bytes" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadUsage_pkey" PRIMARY KEY ("walletAddress","day")
);
