-- Deployment composite primary key + Solana token standard (Track A1c / B0)

ALTER TABLE "Deployment" ADD COLUMN "chainId" TEXT NOT NULL DEFAULT 'solana-mainnet';
ALTER TABLE "Deployment" ADD COLUMN "tokenStandard" TEXT NOT NULL DEFAULT 'token-2022';

ALTER TABLE "Deployment" DROP CONSTRAINT "Deployment_pkey";
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_pkey" PRIMARY KEY ("chainId", "mintAddress");
