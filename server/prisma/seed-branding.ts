import { Prisma, PrismaClient } from '@prisma/client';
import { copyFile, mkdir, rm } from 'fs/promises';
import { extname, join } from 'path';

const SEED_ASSETS_DIR = join(__dirname, 'seed-assets');
const CUSTOMER_UPLOADS_DIR = join(process.cwd(), 'uploads', 'customers');

/** Customer column that stores each seeded branding file. */
const BRANDING_FILES = {
  logoUrl: { field: 'logo', source: 'logo.svg' },
  favicon32x32: { field: 'favicon32x32', source: 'favicon-32x32.png' },
  favicon16x16: { field: 'favicon16x16', source: 'favicon-16x16.png' },
  appleTouch: { field: 'appleTouch', source: 'apple-touch-icon.png' },
} as const;

type BrandingFileColumn = keyof typeof BRANDING_FILES;

/** Acme is gold and cream so it does not copy the design-system cyan. Elite stays pink. */
export const ACME_PALETTE = {
  primaryMain: '#76520e',
  primaryLight: '#E4C56A',
  primaryDark: '#54390A',
  primaryContrast: '#fdf8e1',
  secondaryMain: '#fdf8e1',
  secondaryLight: '#FFFDF6',
  secondaryDark: '#F3E7BE',
  secondaryContrast: '#76520e',
  backgroundColor: '#FBF6E8',
  foregroundColor: '#2B1E0A',
  surfaceColor: '#FFFFFF',
  borderColor: '#F0E4C8',
  mutedForegroundColor: '#7A6640',
  darkPrimaryMain: '#fdf8e1',
  darkPrimaryLight: '#FFFDF4',
  darkPrimaryDark: '#F0E6C4',
  darkPrimaryContrast: '#76520e',
  darkSecondaryMain: '#76520e',
  darkSecondaryLight: '#A67C2D',
  darkSecondaryDark: '#54390A',
  darkSecondaryContrast: '#fdf8e1',
  darkBackgroundColor: '#1B1509',
  darkForegroundColor: '#FDF8E1',
  darkSurfaceColor: '#282011',
  darkBorderColor: '#3D301A',
  darkMutedForegroundColor: '#D4B896',
} satisfies Partial<Prisma.CustomerCreateInput>;

export const ELITE_PALETTE = {
  primaryMain: '#B92777',
  primaryLight: '#D94C98',
  primaryDark: '#8E1B5A',
  primaryContrast: '#FFFFFF',
  secondaryMain: '#D6FDFF',
  secondaryLight: '#EEFEFF',
  secondaryDark: '#9EEFF3',
  secondaryContrast: '#8E1B5A',
  backgroundColor: '#FFF7FA',
  foregroundColor: '#2B0A1C',
  surfaceColor: '#FFFFFF',
  borderColor: '#F3D3E1',
  mutedForegroundColor: '#7A4A60',
  darkPrimaryMain: '#F472B6',
  darkPrimaryLight: '#F9A8D4',
  darkPrimaryDark: '#DB2777',
  darkPrimaryContrast: '#2B0A1C',
  darkSecondaryMain: '#164E63',
  darkSecondaryLight: '#1E6A80',
  darkSecondaryDark: '#0E3A4A',
  darkSecondaryContrast: '#D6FDFF',
  darkBackgroundColor: '#1A0811',
  darkForegroundColor: '#FCE7F3',
  darkSurfaceColor: '#26101B',
  darkBorderColor: '#3D1A2C',
  darkMutedForegroundColor: '#D4A5BC',
} satisfies Partial<Prisma.CustomerCreateInput>;

/**
 * Removes the upload folders of the customers about to be wiped, so a reseed
 * does not leave orphaned branding files behind.
 */
export async function removeCustomerUploads(
  customerIds: string[],
): Promise<void> {
  await Promise.all(
    customerIds.map(id =>
      rm(join(CUSTOMER_UPLOADS_DIR, id), { recursive: true, force: true }),
    ),
  );
}

/**
 * Copies `seed-assets/<slug>/` into the customer's upload folder using the
 * same naming as the upload endpoints, and stores only the filenames.
 * Public URLs are resolved at read time by FileService.
 */
export async function seedCustomerBrandingFiles(
  prisma: PrismaClient,
  customer: { id: string; urlSlug: string },
): Promise<void> {
  const targetDir = join(CUSTOMER_UPLOADS_DIR, customer.id);
  await mkdir(targetDir, { recursive: true });

  const data: Partial<Record<BrandingFileColumn, string>> = {};

  for (const column of Object.keys(BRANDING_FILES) as BrandingFileColumn[]) {
    const { field, source } = BRANDING_FILES[column];
    const filename = `${customer.id}_${field}_seed${extname(source)}`;
    await copyFile(
      join(SEED_ASSETS_DIR, customer.urlSlug, source),
      join(targetDir, filename),
    );
    data[column] = filename;
  }

  await prisma.customer.update({ where: { id: customer.id }, data });
}
