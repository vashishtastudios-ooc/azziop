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
      return 500;
    case 'bold':
    default:
      return 700;
  }
}

// Base headline size. Kept intentionally small so the generated image stays the
// hero and text never overwhelms the creative. Length/hierarchy tiers shrink it further.
const BASE_CLAMP = 'clamp(0.9rem, 3vw, 1.25rem)';

function shrinkClamp(base: string, tier: 0 | 1 | 2): string {
  if (tier === 0) return base;
  if (tier === 1) {
    return base
      .replace('0.9rem', '0.8rem')
      .replace('3vw', '2.6vw')
      .replace('1.25rem', '1.05rem');
  }
  return base
    .replace('0.9rem', '0.72rem')
    .replace('3vw', '2.3vw')
    .replace('1.25rem', '0.92rem');
}

export function getHeadlineTypography(
  creative: SocialCreative,
): HeadlineTypography {
  const rawHeadline = creative.headline ?? '';
  const plain = rawHeadline.trim();
  const charCount = plain.length;

  // Auto-shrink sizing based on headline length.
  const tier: 0 | 1 | 2 = charCount > 42 ? 2 : charCount > 26 ? 1 : 0;

  const hierarchy = creative.textStyle?.hierarchy ?? 'balanced';
  const hierarchyTier: 0 | 1 = hierarchy === 'headline-dominant' ? 0 : 1;
  const finalTier: 0 | 1 | 2 = Math.min(2, tier + hierarchyTier) as 0 | 1 | 2;

  return {
    fontWeight: mapFontWeight(creative.textStyle?.fontWeight),
    fontSize: shrinkClamp(BASE_CLAMP, finalTier),
    textAlign: creative.textStyle?.alignment === 'left' ? 'left' : 'center',
  };
}
