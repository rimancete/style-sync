-- AlterTable
ALTER TABLE "public"."service_pricing" ALTER COLUMN "updatedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."services" ALTER COLUMN "updatedAt" DROP NOT NULL;
