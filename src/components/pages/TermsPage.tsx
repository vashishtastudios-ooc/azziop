'use client';

import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import Link from 'next/link';
import { MarketingPageShell } from '~/components/marketing/MarketingPageShell';
import { MarketingPageBackdrop } from '~/components/marketing/MarketingPageBackdrop';
import { MKT_BADGE, MKT_LINK } from '~/lib/marketingTheme';
import { SITE_URL } from '~/lib/site';

const LAST_UPDATED = 'May 30, 2026';

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: '1. Agreement to terms',
    body: (
      <>
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of Azziop&apos;s
          website, applications, and related services (collectively, the &quot;Service&quot;) at{' '}
          <a href={SITE_URL} className={MKT_LINK}>
            {SITE_URL}
          </a>
          .
        </p>
        <p>
          By registering, subscribing, or using the Service, you agree to these Terms and our{' '}
          <Link href="/privacy" className={MKT_LINK}>
            Privacy Policy
          </Link>
          . If you use the Service on behalf of an organization, you represent that you have
          authority to bind that organization. If you do not agree, do not use the Service.
        </p>
      </>
    ),
  },
  {
    title: '2. Eligibility',
    body: (
      <p>
        You must be at least 16 years old and able to form a binding contract. You may not use the
        Service if you are barred under applicable law or if we have previously suspended your
        account.
      </p>
    ),
  },
  {
    title: '3. Accounts',
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li>You are responsible for keeping your login credentials secure.</li>
        <li>Information you provide must be accurate and kept up to date.</li>
        <li>
          You are responsible for all activity under your account unless you notify us promptly of
          unauthorized use.
        </li>
        <li>We may suspend or terminate accounts that violate these Terms or pose security risk.</li>
      </ul>
    ),
  },
  {
    title: '4. The Service',
    body: (
      <>
        <p className="mb-4">
          Azziop provides AI-powered tools to analyze website URLs, extract brand DNA, generate
          marketing campaigns and creatives, manage credits, and optionally schedule social posts.
          Features vary by plan.
        </p>
        <p>
          We may modify, suspend, or discontinue features with reasonable notice where practicable.
          The Service is provided on an evolving basis; we do not guarantee uninterrupted or
          error-free operation.
        </p>
      </>
    ),
  },
  {
    title: '5. Subscriptions, credits, and payments',
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li>
          Paid plans and credit packs are billed through Razorpay (or other processors we designate).
          Prices and credit allocations are shown at checkout.
        </li>
        <li>
          Subscriptions renew according to the billing interval you select unless cancelled before
          the renewal date.
        </li>
        <li>
          Credits are consumed when you use billable features (e.g. image generation, campaign
          generation). Unused credits may expire as stated on the pricing page or in your plan.
        </li>
        <li>
          Refunds are handled at our discretion except where required by law. Chargebacks without
          contacting support first may result in account suspension.
        </li>
        <li>Taxes may apply based on your location and are your responsibility where applicable.</li>
      </ul>
    ),
  },
  {
    title: '6. Your content and licenses',
    body: (
      <>
        <p className="mb-4">
          You retain ownership of content you upload or create (&quot;Your Content&quot;). You grant
          us a worldwide, non-exclusive license to host, process, display, and transmit Your Content
          solely to operate and improve the Service (including running AI models and publishing to
          connected social accounts when you direct us to).
        </p>
        <p className="mb-4">
          You represent that you have all rights needed for Your Content and URLs you submit, and that
          use of the Service with Your Content does not infringe third-party rights or violate law.
        </p>
        <p>
          AI-generated outputs may be similar to content produced for others. You are responsible for
          reviewing outputs before publication and for compliance with platform rules (Instagram,
          Meta, etc.).
        </p>
      </>
    ),
  },
  {
    title: '7. Acceptable use',
    body: (
      <>
        <p className="mb-4">You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Violate laws, regulations, or third-party rights</li>
          <li>Submit URLs or content you do not have permission to use</li>
          <li>Generate or distribute spam, malware, hate speech, or illegal material</li>
          <li>Attempt to reverse engineer, scrape, or overload the Service</li>
          <li>Resell or sublicense the Service without written permission</li>
          <li>Circumvent usage limits, credit systems, or access controls</li>
          <li>Use the Service to impersonate others or mislead consumers</li>
        </ul>
      </>
    ),
  },
  {
    title: '8. Third-party services',
    body: (
      <p>
        The Service integrates with third parties (e.g. Google sign-in, Razorpay, Meta/Instagram,
        AI providers). Your use of those services is subject to their terms. We are not responsible
        for third-party outages, policy changes, or actions.
      </p>
    ),
  },
  {
    title: '9. Intellectual property',
    body: (
      <p>
        Azziop, our logos, software, and documentation are our property or our licensors&apos;. These
        Terms do not grant you any right to our trademarks or brand except as needed to use the
        Service. Feedback you provide may be used without obligation to you.
      </p>
    ),
  },
  {
    title: '10. Disclaimers',
    body: (
      <p>
        THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF
        ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
        AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT AI OUTPUTS WILL BE ACCURATE, UNIQUE, OR
        SUITABLE FOR ANY PARTICULAR CAMPAIGN OR LEGAL REQUIREMENT.
      </p>
    ),
  },
  {
    title: '11. Limitation of liability',
    body: (
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, AZZIOP AND ITS AFFILIATES, OFFICERS, AND SUPPLIERS
        WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
        OR ANY LOSS OF PROFITS, DATA, OR GOODWILL. OUR TOTAL LIABILITY FOR ANY CLAIM ARISING FROM
        THESE TERMS OR THE SERVICE IS LIMITED TO THE GREATER OF (A) AMOUNTS YOU PAID US IN THE TWELVE
        MONTHS BEFORE THE CLAIM OR (B) ONE HUNDRED U.S. DOLLARS (OR LOCAL EQUIVALENT).
      </p>
    ),
  },
  {
    title: '12. Indemnification',
    body: (
      <p>
        You will defend and indemnify Azziop against claims arising from Your Content, your use of the
        Service, or your violation of these Terms, except to the extent caused by our gross
        negligence or willful misconduct.
      </p>
    ),
  },
  {
    title: '13. Termination',
    body: (
      <p>
        You may stop using the Service at any time. We may suspend or terminate access for breach,
        risk, or legal requirement. Upon termination, your right to use the Service ends; provisions
        that by nature should survive (payment obligations, disclaimers, liability limits,
        indemnity) will survive.
      </p>
    ),
  },
  {
    title: '14. Governing law and disputes',
    body: (
      <p>
        These Terms are governed by the laws of India, without regard to conflict-of-law rules,
        unless mandatory local law requires otherwise. Courts in India shall have exclusive
        jurisdiction, except that either party may seek injunctive relief in any competent court.
        You may also have mandatory consumer rights under your local law that cannot be waived.
      </p>
    ),
  },
  {
    title: '15. Changes',
    body: (
      <p>
        We may update these Terms from time to time. We will post the revised version on this page
        and update the &quot;Last updated&quot; date. Continued use after changes constitutes
        acceptance. Material changes may be communicated by email or in-product notice.
      </p>
    ),
  },
  {
    title: '16. Contact',
    body: (
      <p>
        Questions about these Terms? Email{' '}
        <a href="mailto:hello@azziop.com" className={MKT_LINK}>
          hello@azziop.com
        </a>
        .
      </p>
    ),
  },
];

export function TermsPage() {
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
              <FileText className="w-4 h-4 text-[#FAD400]" />
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-600">
                Legal
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-[#FAD400] mb-4 leading-[1.1]">
              Terms of Service
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
            <Link href="/privacy" className={MKT_LINK}>
              Privacy Policy
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
