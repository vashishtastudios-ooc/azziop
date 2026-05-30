'use client';

import { MarketingNavbar } from '~/components/marketing/MarketingNavbar';

export function MarketingPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-white text-neutral-900 font-body font-light">
      <MarketingNavbar />
      {children}
    </div>
  );
}
