import type { Metadata } from 'next';
import { PrivacyPage } from '~/components/pages/PrivacyPage';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Learn how Azziop collects, uses, and protects your personal data when you use our AI marketing platform.',
};

export default function PrivacyRoutePage() {
  return <PrivacyPage />;
}
