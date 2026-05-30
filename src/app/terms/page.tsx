import type { Metadata } from 'next';
import { TermsPage } from '~/components/pages/TermsPage';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms governing your use of Azziop, including accounts, subscriptions, credits, and acceptable use.',
};

export default function TermsRoutePage() {
  return <TermsPage />;
}
