/*
  Migration to update tenant address structure from single address field to structured fields.
  This migration handles existing data by providing default values and migrating the address field.
*/

-- Step 1: Add new columns with default values
ALTER TABLE "public"."tenants" 
ADD COLUMN     "countryCode" TEXT NOT NULL DEFAULT 'BR',
ADD COLUMN     "street" TEXT NOT NULL DEFAULT 'Unknown Street',
ADD COLUMN     "unit" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "city" TEXT NOT NULL DEFAULT 'Unknown City',
ADD COLUMN     "stateProvince" TEXT NOT NULL DEFAULT 'Unknown State',
ADD COLUMN     "postalCode" TEXT NOT NULL DEFAULT '00000-000',
ADD COLUMN     "formattedAddress" TEXT NOT NULL DEFAULT 'Unknown Address';

-- Step 2: Update formattedAddress with existing address data
UPDATE "public"."tenants" SET "formattedAddress" = "address" WHERE "address" IS NOT NULL;

-- Step 3: Try to parse existing addresses for better data (basic parsing for Brazilian addresses)
UPDATE "public"."tenants" 
SET 
  "street" = CASE 
    WHEN "address" LIKE '%,%' THEN TRIM(SPLIT_PART("address", ',', 1))
    ELSE "address"
  END,
  "city" = CASE 
    WHEN "address" LIKE '%São Paulo%' THEN 'São Paulo'
    WHEN "address" LIKE '%Rio de Janeiro%' THEN 'Rio de Janeiro'
    ELSE 'Unknown City'
  END,
  "stateProvince" = CASE 
    WHEN "address" LIKE '%SP%' THEN 'SP'
    WHEN "address" LIKE '%RJ%' THEN 'RJ'
    ELSE 'BR'
  END
WHERE "address" IS NOT NULL;

-- Step 4: Remove default constraints (they were only needed for the migration)
ALTER TABLE "public"."tenants" ALTER COLUMN "countryCode" DROP DEFAULT;
ALTER TABLE "public"."tenants" ALTER COLUMN "street" DROP DEFAULT;
ALTER TABLE "public"."tenants" ALTER COLUMN "city" DROP DEFAULT;
ALTER TABLE "public"."tenants" ALTER COLUMN "stateProvince" DROP DEFAULT;
ALTER TABLE "public"."tenants" ALTER COLUMN "postalCode" DROP DEFAULT;
ALTER TABLE "public"."tenants" ALTER COLUMN "formattedAddress" DROP DEFAULT;

-- Step 5: Drop the old address column
ALTER TABLE "public"."tenants" DROP COLUMN "address";
