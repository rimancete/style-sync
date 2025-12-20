/*
  Warnings:

  - A unique constraint covering the columns `[confirmationToken]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."bookings" ADD COLUMN     "confirmationToken" TEXT;

-- AlterTable
ALTER TABLE "public"."branches" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC';

-- AlterTable
ALTER TABLE "public"."customers" ADD COLUMN     "defaultTimezone" TEXT NOT NULL DEFAULT 'UTC';

-- CreateTable
CREATE TABLE "public"."branch_schedules" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "branch_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."professional_schedules" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "breakStartTime" TEXT,
    "breakEndTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "professional_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branch_schedules_branchId_dayOfWeek_key" ON "public"."branch_schedules"("branchId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "professional_schedules_professionalId_dayOfWeek_key" ON "public"."professional_schedules"("professionalId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_confirmationToken_key" ON "public"."bookings"("confirmationToken");

-- AddForeignKey
ALTER TABLE "public"."branch_schedules" ADD CONSTRAINT "branch_schedules_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."professional_schedules" ADD CONSTRAINT "professional_schedules_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
