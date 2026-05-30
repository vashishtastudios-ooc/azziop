'use client';

import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import Link from 'next/link';
import { MarketingPageShell } from '~/components/marketing/MarketingPageShell';
import { MarketingPageBackdrop } from '~/components/marketing/MarketingPageBackdrop';
import { MKT_BADGE, MKT_LINK, MKT_LEGAL_SUBHEAD } from '~/lib/marketingTheme';
import { SITE_URL } from '~/lib/site';

const LAST_UPDATED = 'May 30, 2026';

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: '1. Introduction',
    body: (
      <>
        <p>
          Azziop (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the marketing platform at{' '}
          <a href={SITE_URL} className={MKT_LINK}>
            {SITE_URL}
          </a>{' '}
          (the &quot;Service&quot;). This Privacy Policy explains what information we collect, how we
          use it, and the choices you have when you use our website, applications, and related
          services.
        </p>
        <p>
          By creating an account or using the Service, you agree to this policy. If you do not agree,
          please do not use the Service.
        </p>
      </>
    ),
  },
  {
    title: '2. Information we collect',
    body: (
      <>
        <p className={MKT_LEGAL_SUBHEAD}>Account information</p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>Name, email address, and mobile number (when you register)</li>
          <li>Profile photo (if you sign in with Google)</li>
          <li>Authentication credentials handled by our auth provider</li>
        </ul>
        <p className={MKT_LEGAL_SUBHEAD}>Content you provide</p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>Website URLs you submit for brand analysis and campaign generation</li>
          <li>Brand DNA, campaigns, creatives, and scheduling data you create in the product</li>
          <li>Connected social account tokens (e.g. Instagram/Meta) when you authorize publishing</li>
        </ul>
        <p className={MKT_LEGAL_SUBHEAD}>Public website data</p>
        <p className="mb-4">
          When you provide a URL, we may fetch publicly available content from that site (text,
          metadata, images) to power AI features. We do not access password-protected or private
          areas of your site unless you explicitly grant access through a separate integration.
        </p>
        <p className={MKT_LEGAL_SUBHEAD}>Payment information</p>
        <p className="mb-4">
          Subscriptions and credit purchases are processed by Razorpay. We receive transaction
          identifiers and billing status—not your full card number, which Razorpay handles directly.
        </p>
        <p className={MKT_LEGAL_SUBHEAD}>Usage and technical data</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Log data (IP address, browser type, pages visited, timestamps)</li>
          <li>Device and session identifiers needed to secure and operate the Service</li>
          <li>Credit usage, plan tier, and feature usage for billing and quotas</li>
        </ul>
      </>
    ),
  },
  {
    title: '3. How we use your information',
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Provide, maintain, and improve the Service</li>
        <li>Generate brand DNA, campaigns, and creatives using AI</li>
        <li>Process payments, manage subscriptions, and allocate credits</li>
        <li>Schedule and publish content to connected social accounts when you request it</li>
        <li>Send service-related communications (account, billing, security)</li>
        <li>Detect fraud, abuse, and technical issues</li>
        <li>Comply with legal obligations</li>
      </ul>
    ),
  },
  {
    title: '4. AI and automated processing',
    body: (
      <p>
        We use third-party AI services (including Google Gemini) to analyze URLs and generate
        marketing content. Inputs you provide may be sent to these providers subject to their terms.
        We do not use your private project data to train public foundation models unless a separate
        agreement says otherwise.
      </p>
    ),
  },
  {
    title: '5. How we share information',
    body: (
      <>
        <p className="mb-4">We do not sell your personal information. We may share data with:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong className="text-neutral-800 font-medium">Infrastructure &amp; database</strong> — hosting and
            data storage providers
          </li>
          <li>
            <strong className="text-neutral-800 font-medium">Razorpay</strong> — payment processing
          </li>
          <li>
            <strong className="text-neutral-800 font-medium">Google</strong> — OAuth sign-in and AI (Gemini)
          </li>
          <li>
            <strong className="text-neutral-800 font-medium">Meta</strong> — Instagram connection and publishing,
            when you connect an account
          </li>
          <li>
            <strong className="text-neutral-800 font-medium">Professional advisors</strong> — lawyers, accountants,
            or auditors when required
          </li>
          <li>
            <strong className="text-neutral-800 font-medium">Authorities</strong> — when required by law or to
            protect rights and safety
          </li>
        </ul>
      </>
    ),
  },
  {
    title: '6. Data retention',
    body: (
      <p>
        We keep account and project data while your account is active. If you delete your account or
        request deletion, we will remove or anonymize personal data within a reasonable period, except
        where we must retain records for legal, tax, or fraud-prevention purposes (e.g. payment
        records).
      </p>
    ),
  },
  {
    title: '7. Security',
    body: (
      <p>
        We use industry-standard measures including encryption in transit (HTTPS), access controls,
        and server-side-only storage of payment secrets. No method of transmission over the Internet
        is 100% secure; we cannot guarantee absolute security.
      </p>
    ),
  },
  {
    title: '8. Your rights and choices',
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Access or update profile information in your account settings</li>
        <li>Disconnect social integrations at any time</li>
        <li>Request a copy or deletion of your data by contacting us</li>
        <li>Withdraw marketing consent where applicable</li>
        <li>
          Depending on your location (e.g. EU/UK/India), you may have additional rights under local
          privacy laws
        </li>
      </ul>
    ),
  },
  {
    title: '9. Cookies',
    body: (
      <p>
        We use essential cookies and similar technologies for authentication and session management.
        We do not use third-party advertising cookies on the core product. You can control cookies
        through your browser settings; disabling them may limit some features.
      </p>
    ),
  },
  {
    title: '10. Children',
    body: (
      <p>
        The Service is not directed to anyone under 16. We do not knowingly collect personal
        information from children. Contact us if you believe a child has provided data and we will
        delete it.
      </p>
    ),
  },
  {
    title: '11. International transfers',
    body: (
      <p>
        Your information may be processed in countries other than where you live. Where required,
        we use appropriate safeguards for cross-border transfers.
      </p>
    ),
  },
  {
    title: '12. Changes to this policy',
    body: (
      <p>
        We may update this Privacy Policy from time to time. We will post the revised version on this
        page and update the &quot;Last updated&quot; date. Material changes may be communicated by
        email or in-product notice.
      </p>
    ),
  },
  {
    title: '13. Contact us',
    body: (
      <p>
        Questions about this policy or your data? Email{' '}
        <a href="mailto:hello@azziop.com" className={MKT_LINK}>
          hello@azziop.com
        </a>
        .
      </p>
    ),
  },
];

export function PrivacyPage() {
  return (
    <MarketingPageShell>
      <div className="relative pt-24 pb-20 px-4 lg:px-8 overflow-hidden">
        <MarketingPageBackdrop />

        <div className="relative max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className={`${MKT_BADGE} mb-8`}>
              <Shield className="w-4 h-4 text-[#FAD400]" />
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-600">
                Legal
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-[#FAD400] mb-4 leading-[1.1]">
              Privacy Policy
            </h1>

            <p className="text-neutral-500 font-mono text-sm">Last updated: {LAST_UPDATED}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-none space-y-10 text-neutral-600 leading-relaxed font-light"
          >
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-display font-semibold text-[#FAD400] mb-3">
                  {section.title}
                </h2>
                <div className="space-y-3 text-sm md:text-base">{section.body}</div>
              </section>
            ))}
          </motion.div>

          <p className="mt-12 text-center text-sm text-neutral-500 space-x-4 font-light">
            <Link href="/terms" className={MKT_LINK}>
              Terms of Service
            </Link>
            <span className="text-neutral-300">·</span>
            <Link href="/" className={MKT_LINK}>
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </MarketingPageShell>
  );
}
