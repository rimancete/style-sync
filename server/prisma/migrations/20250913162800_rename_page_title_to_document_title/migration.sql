-- Step 1: Add the new documentTitle column with data from pageTitle
ALTER TABLE "public"."customers"
ADD COLUMN "documentTitle" TEXT;

-- Step 2: Copy data from pageTitle to documentTitle
UPDATE "public"."customers"
SET "documentTitle" = "pageTitle"
WHERE "pageTitle" IS NOT NULL;

-- Step 3: Set default value for documentTitle
UPDATE "public"."customers"
SET "documentTitle" = ''
WHERE "documentTitle" IS NULL;

-- Step 4: Make documentTitle NOT NULL
ALTER TABLE "public"."customers"
ALTER COLUMN "documentTitle" SET NOT NULL;

-- Step 5: Drop the old pageTitle column
ALTER TABLE "public"."customers" DROP COLUMN "pageTitle";

-- Other table alterations
ALTER TABLE "public"."bookings" ALTER COLUMN "branchId" DROP DEFAULT;
ALTER TABLE "public"."professionals" ALTER COLUMN "branchId" DROP DEFAULT,
ALTER COLUMN "customerId" DROP DEFAULT;
ALTER TABLE "public"."service_pricing" ALTER COLUMN "branchId" DROP DEFAULT;
ALTER TABLE "public"."services" ALTER COLUMN "customerId" DROP DEFAULT;
ALTER TABLE "public"."tenants" ALTER COLUMN "customerId" DROP DEFAULT;
