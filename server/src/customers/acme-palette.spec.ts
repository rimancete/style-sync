import { ACME_PALETTE } from '../../prisma/seed-branding';

const DESIGN_SYSTEM_CYAN = '#0E7490';

describe('ACME_PALETTE', () => {
  it('uses gold for the primary and cream for contrast and secondary', () => {
    expect(ACME_PALETTE.primaryMain).toBe('#76520e');
    expect(ACME_PALETTE.primaryContrast).toBe('#fdf8e1');
    expect(ACME_PALETTE.secondaryMain).toBe('#fdf8e1');
    expect(ACME_PALETTE.secondaryContrast).toBe('#76520e');
    expect(ACME_PALETTE.darkPrimaryMain).toBe('#fdf8e1');
    expect(ACME_PALETTE.darkPrimaryContrast).toBe('#76520e');
    expect(ACME_PALETTE.darkSecondaryMain).toBe('#76520e');
    expect(ACME_PALETTE.darkSecondaryContrast).toBe('#fdf8e1');
    expect(ACME_PALETTE.primaryMain).not.toBe(DESIGN_SYSTEM_CYAN);
    expect(ACME_PALETTE.darkBackgroundColor).toBe('#1B1509');
    expect(ACME_PALETTE.darkSurfaceColor).toBe('#282011');
    expect(ACME_PALETTE.darkBorderColor).toBe('#3D301A');
    expect(ACME_PALETTE.darkForegroundColor).toBe('#FDF8E1');
    expect(ACME_PALETTE.darkMutedForegroundColor).toBe('#D4B896');
    expect(ACME_PALETTE.backgroundColor).toBe('#FBF6E8');
    expect(ACME_PALETTE.foregroundColor).toBe('#2B1E0A');
    expect(ACME_PALETTE.borderColor).toBe('#F0E4C8');
    expect(ACME_PALETTE.mutedForegroundColor).toBe('#7A6640');
  });
});
