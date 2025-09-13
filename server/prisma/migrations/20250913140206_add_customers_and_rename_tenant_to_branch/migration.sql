/*
  Warnings:

  - You are about to drop the column `tenantId` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `professionals` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `service_pricing` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[serviceId,branchId]` on the table `service_pricing` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `branchId` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `branchId` to the `professionals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerId` to the `professionals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `branchId` to the `service_pricing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerId` to the `services` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerId` to the `tenants` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "public"."customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "urlSlug" TEXT NOT NULL,
    "pageTitle" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT,
    "logoAlt" TEXT NOT NULL DEFAULT '',
    "favicon32x32" TEXT,
    "favicon16x16" TEXT,
    "appleTouch" TEXT,
    "primaryMain" TEXT NOT NULL DEFAULT '#272726FF',
    "primaryLight" TEXT NOT NULL DEFAULT '#706E6DFF',
    "primaryDark" TEXT NOT NULL DEFAULT '#1B1B1BFF',
    "primaryContrast" TEXT NOT NULL DEFAULT '#ECE8E6FF',
    "secondaryMain" TEXT NOT NULL DEFAULT '#8D8C8BFF',
    "secondaryLight" TEXT NOT NULL DEFAULT '#E7E7E6FF',
    "secondaryDark" TEXT NOT NULL DEFAULT '#3B3B3BFF',
    "secondaryContrast" TEXT NOT NULL DEFAULT '#1B1B1BFF',
    "backgroundColor" TEXT NOT NULL DEFAULT '#F7F7F7FF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_customers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_customers_pkey" PRIMARY KEY ("id")
);

-- Create a default customer for existing data
INSERT INTO "public"."customers" ("id", "name", "urlSlug", "isActive", "createdAt", "updatedAt") VALUES ('default-customer-id', 'Default Customer', 'default', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add customerId column to tenants with default customer
ALTER TABLE "public"."tenants" ADD COLUMN "customerId" TEXT NOT NULL DEFAULT 'default-customer-id';

-- Add customerId column to services with default customer
ALTER TABLE "public"."services" ADD COLUMN "customerId" TEXT NOT NULL DEFAULT 'default-customer-id';

-- Add branchId and customerId columns to professionals with defaults
ALTER TABLE "public"."professionals" ADD COLUMN "branchId" TEXT NOT NULL DEFAULT '',
ADD COLUMN "customerId" TEXT NOT NULL DEFAULT 'default-customer-id';

-- Add branchId column to service_pricing with default
ALTER TABLE "public"."service_pricing" ADD COLUMN "branchId" TEXT NOT NULL DEFAULT '';

-- Add branchId column to bookings with default
ALTER TABLE "public"."bookings" ADD COLUMN "branchId" TEXT NOT NULL DEFAULT '';

-- Update professionals: set branchId from tenantId and customerId from tenant's customerId
UPDATE "public"."professionals" SET "branchId" = "tenantId", "customerId" = (SELECT "customerId" FROM "public"."tenants" WHERE "tenants"."id" = "professionals"."tenantId");

-- Update service_pricing: set branchId from tenantId
UPDATE "public"."service_pricing" SET "branchId" = "tenantId";

-- Update bookings: set branchId from tenantId
UPDATE "public"."bookings" SET "branchId" = "tenantId";

-- DropForeignKey
ALTER TABLE "public"."bookings" DROP CONSTRAINT "bookings_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."professionals" DROP CONSTRAINT "professionals_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."service_pricing" DROP CONSTRAINT "service_pricing_tenantId_fkey";

-- DropIndex
DROP INDEX "public"."service_pricing_serviceId_tenantId_key";

-- AlterTable (remove tenantId columns)
ALTER TABLE "public"."bookings" DROP COLUMN "tenantId";
ALTER TABLE "public"."professionals" DROP COLUMN "tenantId";
ALTER TABLE "public"."service_pricing" DROP COLUMN "tenantId";

-- CreateIndex
CREATE UNIQUE INDEX "customers_urlSlug_key" ON "public"."customers"("urlSlug");

-- CreateIndex
CREATE UNIQUE INDEX "user_customers_userId_customerId_key" ON "public"."user_customers"("userId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "service_pricing_serviceId_branchId_key" ON "public"."service_pricing"("serviceId", "branchId");

-- AddForeignKey
ALTER TABLE "public"."tenants" ADD CONSTRAINT "tenants_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."professionals" ADD CONSTRAINT "professionals_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."professionals" ADD CONSTRAINT "professionals_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."services" ADD CONSTRAINT "services_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_pricing" ADD CONSTRAINT "service_pricing_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_customers" ADD CONSTRAINT "user_customers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_customers" ADD CONSTRAINT "user_customers_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
