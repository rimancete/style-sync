/*
  Warnings:

  - You are about to drop the column `branchId` on the `professionals` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[displayId]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[displayId]` on the table `branches` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[displayId]` on the table `countries` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[displayId]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[displayId]` on the table `professionals` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[documentId,customerId]` on the table `professionals` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[displayId]` on the table `service_pricing` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[displayId]` on the table `services` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[displayId]` on the table `user_customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[displayId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."professionals" DROP CONSTRAINT "professionals_branchId_fkey";

-- AlterTable
ALTER TABLE "public"."bookings" ADD COLUMN     "displayId" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "public"."branches" ADD COLUMN     "displayId" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "public"."countries" ADD COLUMN     "displayId" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "public"."customers" ADD COLUMN     "displayId" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "public"."professionals" DROP COLUMN "branchId",
ADD COLUMN     "displayId" SERIAL NOT NULL,
ADD COLUMN     "documentId" TEXT;

-- AlterTable
ALTER TABLE "public"."service_pricing" ADD COLUMN     "displayId" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "public"."services" ADD COLUMN     "displayId" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "public"."user_customers" ADD COLUMN     "displayId" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "displayId" SERIAL NOT NULL;

-- CreateTable
CREATE TABLE "public"."professional_branches" (
    "id" TEXT NOT NULL,
    "displayId" SERIAL NOT NULL,
    "professionalId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_branches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "professional_branches_displayId_key" ON "public"."professional_branches"("displayId");

-- CreateIndex
CREATE UNIQUE INDEX "professional_branches_professionalId_branchId_key" ON "public"."professional_branches"("professionalId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_displayId_key" ON "public"."bookings"("displayId");

-- CreateIndex
CREATE UNIQUE INDEX "branches_displayId_key" ON "public"."branches"("displayId");

-- CreateIndex
CREATE UNIQUE INDEX "countries_displayId_key" ON "public"."countries"("displayId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_displayId_key" ON "public"."customers"("displayId");

-- CreateIndex
CREATE UNIQUE INDEX "professionals_displayId_key" ON "public"."professionals"("displayId");

-- CreateIndex
CREATE UNIQUE INDEX "professionals_documentId_customerId_key" ON "public"."professionals"("documentId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "service_pricing_displayId_key" ON "public"."service_pricing"("displayId");

-- CreateIndex
CREATE UNIQUE INDEX "services_displayId_key" ON "public"."services"("displayId");

-- CreateIndex
CREATE UNIQUE INDEX "user_customers_displayId_key" ON "public"."user_customers"("displayId");

-- CreateIndex
CREATE UNIQUE INDEX "users_displayId_key" ON "public"."users"("displayId");

-- AddForeignKey
ALTER TABLE "public"."professional_branches" ADD CONSTRAINT "professional_branches_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."professional_branches" ADD CONSTRAINT "professional_branches_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
