import type { SocialCreative } from '@/types';

type HeadlineTypography = {
  fontWeight: number;
  fontSize: string;
  textAlign: 'left' | 'center';
};

function mapFontWeight(weight: SocialCreative['textStyle']['fontWeight'] | null | undefined): number {
  switch (weight) {
    case 'light':
      return 300;
    case 'regular':
      return 600;
    case 'bold':
    default:
      return 900;
  }
}

function baseClampForLayout(layoutIndex: number): string {
  switch (layoutIndex % 5) {
    case 0:
      return 'clamp(1.5rem, 5vw, 2rem)';
    case 1:
      return 'clamp(1.6rem, 6vw, 2.2rem)';
    case 2:
      return 'clamp(1.8rem, 7vw, 2.5rem)';
    case 3:
      return 'clamp(1rem, 3.5vw, 1.4rem)';
    case 4:
    default:
      return 'clamp(1.3rem, 4vw, 1.8rem)';
  }
}

function shrinkClamp(base: string, tier: 0 | 1 | 2): string {
  if (tier === 0) return base;
  if (tier === 1) {
    return base
      .replace('1.8rem', '1.55rem')
      .replace('1.6rem', '1.45rem')
      .replace('1.5rem', '1.35rem')
      .replace('1.3rem', '1.2rem')
      .replace('1rem', '0.92rem')
      .replace('2.5rem', '2.15rem')
      .replace('2.2rem', '1.95rem')
      .replace('2rem', '1.8rem')
      .replace('1.8rem', '1.65rem')
      .replace('1.4rem', '1.25rem');
  }
  return base
    .replace('1.8rem', '1.35rem')
    .replace('1.6rem', '1.3rem')
    .replace('1.5rem', '1.2rem')
    .replace('1.3rem', '1.05rem')
    .replace('1rem', '0.85rem')
    .replace('2.5rem', '1.8rem')
    .replace('2.2rem', '1.7rem')
    .replace('2rem', '1.6rem')
    .replace('1.8rem', '1.45rem')
    .replace('1.4rem', '1.1rem');
}

export function getHeadlineTypography(
  creative: SocialCreative,
  layoutIndex: number,
): HeadlineTypography {
  const rawHeadline = creative.headline ?? '';
  const plain = rawHeadline.trim();
  const charCount = plain.length;

  // Auto-shrink sizing based on headline length.
  const tier: 0 | 1 | 2 = charCount > 42 ? 2 : charCount > 26 ? 1 : 0;

  const hierarchy = creative.textStyle?.hierarchy ?? 'balanced';
  const hierarchyTier: 0 | 1 = hierarchy === 'headline-dominant' ? 0 : 1;
  const finalTier: 0 | 1 | 2 = Math.min(2, tier + hierarchyTier) as 0 | 1 | 2;

  const baseClamp = baseClampForLayout(layoutIndex);
  return {
    fontWeight: mapFontWeight(creative.textStyle?.fontWeight),
    fontSize: shrinkClamp(baseClamp, finalTier),
    textAlign: creative.textStyle?.alignment === 'left' ? 'left' : 'center',
  };
}

