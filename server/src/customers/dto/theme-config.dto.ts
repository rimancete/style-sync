import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/** Accepts `#RGB`, `#RRGGBB` and `#RRGGBBAA`. */
export const HEX_COLOR_PATTERN =
  /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
const HEX_COLOR_MESSAGE =
  '$property must be a hex color (#RGB, #RRGGBB or #RRGGBBAA)';

function HexColorProperty(): PropertyDecorator {
  return (target, propertyKey) => {
    ApiProperty({ required: false, example: '#0E7490' })(target, propertyKey);
    IsOptional()(target, propertyKey);
    Matches(HEX_COLOR_PATTERN, { message: HEX_COLOR_MESSAGE })(
      target,
      propertyKey,
    );
  };
}

export class ThemeColorsDto {
  @HexColorProperty()
  main?: string;

  @HexColorProperty()
  light?: string;

  @HexColorProperty()
  dark?: string;

  @HexColorProperty()
  contrast?: string;
}

export class ThemePaletteDto {
  @ApiProperty({ required: false, type: ThemeColorsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ThemeColorsDto)
  primary?: ThemeColorsDto;

  @ApiProperty({ required: false, type: ThemeColorsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ThemeColorsDto)
  secondary?: ThemeColorsDto;

  @HexColorProperty()
  background?: string;

  @HexColorProperty()
  foreground?: string;

  @HexColorProperty()
  surface?: string;

  @HexColorProperty()
  border?: string;

  @HexColorProperty()
  mutedForeground?: string;
}

export class ThemeConfigDto {
  @ApiProperty({ required: false, type: ThemePaletteDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ThemePaletteDto)
  light?: ThemePaletteDto;

  @ApiProperty({ required: false, type: ThemePaletteDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ThemePaletteDto)
  dark?: ThemePaletteDto;
}
