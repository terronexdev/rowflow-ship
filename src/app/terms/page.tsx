'use client';

import Link from 'next/link';
import { LegalChrome } from '@/components/legal/LegalChrome';

export default function TermsPage() {
  return (
    <LegalChrome title="Terms of Service">
      <p>
        <strong>Important:</strong> Tractsource and ROWFlow provide software tools and third-party
        open GIS data for planning and project workflows. They are <strong>not</strong> a legal
        survey, title search, appraisal, or substitute for licensed professional advice. By creating
        an account or using the Services, you agree to these Terms and our{' '}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>1. Agreement</h2>
      <p>
        These Terms form a contract between you (the individual or entity using the Services) and
        Terronex LLC (“Terronex,” “we,” “us”). If you use the Services on behalf of a company, you
        represent that you have authority to bind that company.
      </p>

      <h2>2. Accounts</h2>
      <ul>
        <li>You must provide accurate account information and keep credentials secure.</li>
        <li>You are responsible for activity under your account and seats you invite.</li>
        <li>We may suspend accounts for abuse, non-payment, or risk to the Services or others.</li>
        <li>Founder/staff access may be granted at our discretion and can be revoked.</li>
      </ul>

      <h2>3. The Services</h2>
      <p>
        <strong>ROWFlow</strong> is right-of-way / land acquisition workspace software (projects,
        parcels, map, statuses, compensation, labor, team, analytics).
      </p>
      <p>
        <strong>Tractsource</strong> extracts and exports parcel data from third-party open GIS or
        user uploads (AOI and corridor workflows, multiple file formats, optional handoff to
        ROWFlow).
      </p>
      <p>Features may change as we iterate. Alpha/beta features are provided as-is.</p>

      <h2>4. Subscriptions, pricing &amp; suite</h2>
      <ul>
        <li>
          <strong>ROWFlow Pro</strong> — currently a flat <strong>$49.99/month</strong> subscription
          (limits and features as shown in-app / pricing page).
        </li>
        <li>
          <strong>Tractsource</strong> — currently a flat <strong>$9.99/month</strong> subscription
          with a monthly billable data allowance (currently 50 MB/month after an initial allowance; metered GeoJSON), as described
          in-app.
        </li>
        <li>
          <strong>Suite entitlement:</strong> An <strong>active ROWFlow Pro</strong> subscription
          may include Tractsource access at no extra charge when we can match the same billing email
          / Stripe customer. If ROWFlow Pro lapses, Tractsource suite access ends unless you keep a
          standalone Tractsource subscription.
        </li>
        <li>
          Taxes may apply. Payments are processed by Stripe. You authorize recurring charges until
          you cancel.
        </li>
        <li>
          Cancel anytime via the billing portal or by contacting support; access continues through
          the paid period unless otherwise stated. Fees are generally non-refundable except where
          required by law or at our discretion.
        </li>
        <li>
          We may change prices with notice; continued use after the change effective date constitutes
          acceptance.
        </li>
      </ul>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Violate law or others’ rights</li>
        <li>Attempt unauthorized access, scrape beyond permitted product use, or disrupt the Services</li>
        <li>Upload malware or unlawful content</li>
        <li>
          Misrepresent Tractsource/ROWFlow outputs as certified surveys, title opinions, or official
          ownership records
        </li>
        <li>Resell raw bulk county extracts in violation of source license terms</li>
        <li>Share login credentials in a way that bypasses seat/billing limits</li>
      </ul>

      <h2>6. Your content &amp; data</h2>
      <p>
        You retain rights to content you upload (projects, files, notes). You grant Terronex a
        license to host, process, and display that content solely to provide and improve the
        Services. You represent you have rights to upload the data you provide.
      </p>

      <h2>7. Third-party data &amp; disclaimers</h2>
      <ul>
        <li>
          Open GIS parcel/owner/address data is from third parties and may be incomplete, outdated,
          or wrong.
        </li>
        <li>Outputs are for informational and project-support use only.</li>
        <li>
          <strong>Not a legal survey or title product.</strong> Verify critical decisions with
          primary sources and licensed professionals.
        </li>
        <li>Map basemaps and boundary layers are provided by third parties under their terms.</li>
      </ul>

      <h2>8. Intellectual property</h2>
      <p>
        The Services, software, branding, and documentation are owned by Terronex or its licensors.
        These Terms do not transfer ownership to you.
      </p>

      <h2>9. Confidentiality</h2>
      <p>
        Non-public project data you store is treated as your confidential information; we use it
        only as needed to operate the Services and as described in the Privacy Policy.
      </p>

      <h2>10. Beta / availability</h2>
      <p>
        Services may be unavailable during maintenance or outages. We do not guarantee uninterrupted
        or error-free operation. We may throttle abusive usage or enforce per-job parcel/data caps.
      </p>

      <h2>11. Warranties</h2>
      <p>
        THE SERVICES ARE PROVIDED <strong>“AS IS”</strong> AND <strong>“AS AVAILABLE”</strong>{' '}
        WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A
        PARTICULAR PURPOSE, AND NON-INFRINGEMENT. Third-party data is provided without warranty of
        accuracy or completeness.
      </p>

      <h2>12. Limitation of liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, TERRONEX WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL,
        SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOST PROFITS, DATA, OR BUSINESS, ARISING FROM
        THE SERVICES OR THESE TERMS. OUR TOTAL LIABILITY FOR ANY CLAIM RELATING TO THE SERVICES IS
        LIMITED TO THE AMOUNTS YOU PAID US FOR THE SERVICES IN THE <strong>three (3) months</strong>{' '}
        before the claim (or USD $100 if you have paid nothing).
      </p>

      <h2>13. Indemnity</h2>
      <p>
        You will defend and indemnify Terronex against claims arising from your content, your misuse
        of the Services, or your violation of these Terms or third-party data licenses, except to
        the extent caused by our willful misconduct.
      </p>

      <h2>14. Termination</h2>
      <p>
        You may stop using the Services at any time. We may suspend or terminate access for breach
        or risk. Provisions that by nature should survive (disclaimers, liability limits, indemnity,
        IP) survive termination.
      </p>

      <h2>15. Governing law</h2>
      <p>
        These Terms are governed by the laws of the Commonwealth of Virginia, USA, without regard to
        conflict-of-law rules, unless mandatory local law says otherwise. Courts located in Virginia
        shall have exclusive jurisdiction, except where prohibited.
      </p>

      <h2>16. Changes</h2>
      <p>
        We may update these Terms. We will update the effective date and may provide notice for
        material changes. Continued use after changes become effective constitutes acceptance.
      </p>

      <h2>17. Contact</h2>
      <p>
        Terronex LLC · <a href="mailto:support@terronex.dev">support@terronex.dev</a>
        <br />
        Related: <Link href="/privacy">Privacy Policy</Link>
      </p>
    </LegalChrome>
  );
}
