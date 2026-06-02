import Image from 'next/image';
import { SITE_LOGO } from '~/lib/site';

type AzziopLogoProps = {
  size?: number;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  className?: string;
  priority?: boolean;
};

export function AzziopLogo({
  size = 32,
  showWordmark = true,
  wordmarkClassName = 'font-display font-bold text-neutral-900 text-lg hidden sm:block',
  className = '',
  priority = false,
}: AzziopLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src={SITE_LOGO}
        alt="Azziop"
        width={size}
        height={size}
        className="object-contain shrink-0"
        priority={priority}
      />
      {showWordmark && <span className={wordmarkClassName}>Azziop</span>}
    </span>
  );
}
