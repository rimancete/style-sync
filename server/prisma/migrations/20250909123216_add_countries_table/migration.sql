/*
  Migration to add countries table and link tenants to countries.
  This handles existing tenant data by creating a default Brazil country.
*/

-- CreateTable
CREATE TABLE "public"."countries" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "addressFormat" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "countries_code_key" ON "public"."countries"("code");

-- Insert default country (Brazil)
INSERT INTO "public"."countries" ("id", "code", "name", "addressFormat", "createdAt", "updatedAt")
VALUES (
    'default_country_br',
    'BR',
    'Brazil',
    '{
      "fields": ["street", "unit", "district", "city", "stateProvince", "postalCode"],
      "required": ["street", "city", "stateProvince", "postalCode"],
      "validation": {
        "postalCode": "^[0-9]{5}-?[0-9]{3}$",
        "stateProvince": ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"]
      },
      "labels": {
        "street": "Logradouro",
        "unit": "Número/Apartamento",
        "district": "Bairro",
        "city": "Cidade",
        "stateProvince": "Estado",
        "postalCode": "CEP"
      }
    }',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- AlterTable: Add countryId column with default value
ALTER TABLE "public"."tenants" ADD COLUMN "countryId" TEXT NOT NULL DEFAULT 'default_country_br';

-- AddForeignKey
ALTER TABLE "public"."tenants" ADD CONSTRAINT "tenants_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "public"."countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Remove default constraint (we only needed it for migration)
ALTER TABLE "public"."tenants" ALTER COLUMN "countryId" DROP DEFAULT;
