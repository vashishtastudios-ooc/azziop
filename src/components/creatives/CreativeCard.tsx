'use client';

import { Image as ImageIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SocialCreative } from '@/types';
import { getHeadlineTypography } from '@/lib/creativeTypography';

type EditableElement = 'headline' | 'description' | 'cta';

export interface CreativeCardProps {
  creative: SocialCreative;
  imageUrl?: string | null;
  headingFontFamily: string;
  bodyFontFamily: string;
  /** Brand primary color — used by the duotone overlay and accent text. */
  primary: string;
  showHeadline?: boolean;
  showDescription?: boolean;
  showCta?: boolean;
  /** When provided, the image is clickable (e.g. open an image modal). */
  onImageClick?: () => void;
  /** Editor injects per-element edit buttons; grid omits this. */
  renderEditButton?: (element: EditableElement) => ReactNode;
  rounded?: boolean;
}

function contrastColor(hex: string): string {
  const h = hex.replace('#', '');
  if (h.length < 6) return '#ffffff';
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
}

/** Where the text block sits, derived from the AI-chosen layout. */
function placementClasses(layout: SocialCreative['layout']): string {
  switch (layout) {
    case 'hero-center':
      return 'justify-center items-center text-center';
    case 'split-right':
      return 'justify-end items-end text-right';
    case 'split-left':
      return 'justify-end items-start text-left';
    case 'card-stack':
    case 'diagonal-split':
    case 'minimal-bottom':
    case 'full-bleed':
    default:
      return 'justify-end items-start text-left';
  }
}

function isLightOverlay(overlay: SocialCreative['overlayStyle']): boolean {
  return overlay === 'gradient-light' || overlay === 'solid-light';
}

/** Full-canvas overlay tint/gradient behind the text, derived from overlayStyle. */
function overlayStyleObject(
  overlay: SocialCreative['overlayStyle'],
  layout: SocialCreative['layout'],
  primary: string,
): React.CSSProperties | null {
  switch (overlay) {
    case 'gradient-dark':
      return {
        background:
          'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.28) 45%, transparent 75%)',
      };
    case 'gradient-light':
      return {
        background:
          'linear-gradient(to top, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.35) 45%, transparent 75%)',
      };
    case 'solid-dark':
      return { backgroundColor: 'rgba(0,0,0,0.4)' };
    case 'solid-light':
      return { backgroundColor: 'rgba(255,255,255,0.45)' };
    case 'duotone':
      return { backgroundColor: primary, opacity: 0.55, mixBlendMode: 'multiply' };
    case 'blur-heavy':
    case 'blur-light':
    case 'none':
    default:
      // diagonal-split still wants a subtle directional gradient for legibility.
      if (layout === 'diagonal-split') {
        return {
          background:
            'linear-gradient(to top right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.2) 45%, transparent 70%)',
        };
      }
      return null;
  }
}

/** Optional panel behind the text (card-stack + blur overlays). */
function textPanelClasses(
  overlay: SocialCreative['overlayStyle'],
  layout: SocialCreative['layout'],
): string {
  if (overlay === 'blur-heavy') return 'rounded-xl backdrop-blur-md bg-black/25 p-3';
  if (overlay === 'blur-light') return 'rounded-xl backdrop-blur-sm bg-black/15 p-3';
  if (layout === 'card-stack') return 'rounded-xl bg-black/45 p-3';
  return '';
}

export function CreativeCard({
  creative,
  imageUrl,
  headingFontFamily,
  bodyFontFamily,
  primary,
  showHeadline = true,
  showDescription = true,
  showCta = true,
  onImageClick,
  renderEditButton,
  rounded = false,
}: CreativeCardProps) {
  const roundedClass = rounded ? 'rounded-2xl' : '';
  const isEditable = typeof renderEditButton === 'function';
  const groupClass = isEditable ? 'group ' : '';

  // ── Product infographic: fixed conversion layout, headline/desc top, CTA bottom ──
  if (creative.layoutTemplate === 'product-infographic') {
    return (
      <div className={`${groupClass}relative w-full h-full overflow-hidden bg-[#050505] ${roundedClass}`}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover${onImageClick ? ' cursor-pointer' : ''}`}
            onClick={onImageClick}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
            <ImageIcon className="w-12 h-12 text-neutral-500" />
          </div>
        )}

        <div
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{
            height: '40%',
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 60%, transparent 100%)',
          }}
        />
        <div className="absolute top-0 inset-x-0 p-3 sm:p-4 z-10">
          <div className="relative">
            {isEditable && renderEditButton('headline')}
            {showHeadline && (
              <h3
                className="text-white font-bold text-sm sm:text-[0.95rem] leading-tight line-clamp-2 drop-shadow-md"
                style={{ fontFamily: headingFontFamily }}
              >
                {creative.headline}
              </h3>
            )}
          </div>
          {(creative.description || isEditable) && (
            <div className="relative mt-1">
              {isEditable && renderEditButton('description')}
              {showDescription && creative.description && (
                <p
                  className="text-white/75 text-[10px] sm:text-[11px] leading-snug line-clamp-2 max-w-[95%] drop-shadow-sm"
                  style={{ fontFamily: bodyFontFamily }}
                >
                  {creative.description}
                </p>
              )}
            </div>
          )}
        </div>

        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: '28%',
            background:
              'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.18) 65%, transparent 100%)',
          }}
        />
        {creative.cta && showCta && (
          <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 z-10 flex justify-center">
            <div className="relative">
              {isEditable && renderEditButton('cta')}
              <span
                className="inline-flex items-center px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full backdrop-blur-sm shadow-lg"
                style={{
                  color: '#fff',
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.25)',
                }}
              >
                {creative.cta}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Standard creative: AI layout + overlay drive text placement/treatment ──
  const typography = getHeadlineTypography(creative);
  const light = isLightOverlay(creative.overlayStyle);
  const headingColor =
    creative.overlayStyle === 'duotone' ? contrastColor(primary) : light ? '#1a1a1a' : '#ffffff';
  const bodyColor = light ? 'rgba(0,0,0,0.68)' : 'rgba(255,255,255,0.78)';
  const overlay = overlayStyleObject(creative.overlayStyle, creative.layout, primary);
  const panelClass = textPanelClasses(creative.overlayStyle, creative.layout);
  const textShadow = creative.overlayStyle === 'none' && !light ? '0 1px 6px rgba(0,0,0,0.6)' : undefined;

  return (
    <div className={`${groupClass}relative w-full h-full overflow-hidden bg-[#111] ${roundedClass}`}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover${onImageClick ? ' cursor-pointer' : ''}`}
          onClick={onImageClick}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
          <ImageIcon className="w-10 h-10 text-neutral-500" />
        </div>
      )}

      {overlay && <div className="absolute inset-0 pointer-events-none" style={overlay} />}

      <div className={`absolute inset-0 flex flex-col p-4 sm:p-5 z-10 ${placementClasses(creative.layout)}`}>
        <div className={`max-w-[92%] ${panelClass}`}>
          <div className="relative">
            {isEditable && renderEditButton('headline')}
            {showHeadline && (
              <h3
                className="leading-[1.05] mb-1.5 tracking-tight"
                style={{
                  fontFamily: headingFontFamily,
                  fontWeight: typography.fontWeight,
                  fontSize: typography.fontSize,
                  color: headingColor,
                  textShadow,
                }}
              >
                {creative.headline}
              </h3>
            )}
          </div>
          {(creative.description || isEditable) && (
            <div className="relative">
              {isEditable && renderEditButton('description')}
              {showDescription && creative.description && (
                <p
                  className="text-[10px] sm:text-xs leading-snug line-clamp-2 mb-2"
                  style={{ fontFamily: bodyFontFamily, color: bodyColor, textShadow }}
                >
                  {creative.description}
                </p>
              )}
            </div>
          )}
          {creative.cta && showCta && (
            <div className="relative inline-block">
              {isEditable && renderEditButton('cta')}
              <span
                className="inline-flex items-center px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full"
                style={{
                  color: headingColor,
                  border: `1px solid ${light ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.45)'}`,
                }}
              >
                {creative.cta}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
