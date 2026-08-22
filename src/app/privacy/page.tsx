'use client';

import Link from 'next/link';
import { LegalChrome } from '@/components/legal/LegalChrome';

export default function PrivacyPage() {
  return (
    <LegalChrome title="Privacy Policy">
      <p>
        <strong>Plain-language summary:</strong> We collect account info, usage, and project/parcel
        data you upload or extract so we can run the Services, bill you, and improve the product. We
        don’t sell your personal information. Parcel/owner data comes from third-party open GIS or
        your uploads and is not a title product.
      </p>

      <h2>1. Who we are</h2>
      <p>
        Terronex LLC (“Terronex,” “we,” “us”) operates ROWFlow, Tractsource, and related suite
        features. Contact:{' '}
        <a href="mailto:support@terronex.dev">support@terronex.dev</a>.
      </p>

      <h2>2. Information we collect</h2>
      <ul>
        <li>
          <strong>Account data</strong> — name, email, authentication identifiers (e.g. Google
          OAuth), password hash if you use email/password.
        </li>
        <li>
          <strong>Billing data</strong> — handled by Stripe (card numbers are not stored on our
          servers). We store Stripe customer/subscription IDs and plan status.
        </li>
        <li>
          <strong>Service data</strong> — projects, parcels, geometry, owner/situs fields, notes,
          documents you upload, labor/compensation entries, team invites, extract jobs and exports.
        </li>
        <li>
          <strong>Technical data</strong> — IP address, browser/device info, logs, cookies/session
          tokens, approximate usage metrics (e.g. billable extract bytes).
        </li>
        <li>
          <strong>Communications</strong> — support emails and transactional mail (invites, billing,
          product notices).
        </li>
      </ul>

      <h2>3. How we use information</h2>
      <ul>
        <li>Provide, secure, and improve the Services</li>
        <li>Authenticate users and enforce access controls</li>
        <li>
          Process subscriptions, quotas, and suite entitlements (e.g. Tractsource included with
          ROWFlow Pro)
        </li>
        <li>Send transactional messages (security, billing, invites)</li>
        <li>Debug, prevent abuse, and comply with law</li>
      </ul>
      <p>
        We do <strong>not sell</strong> personal information. We do not use your project content to
        train public AI models.
      </p>

      <h2>4. Third-party open GIS &amp; parcel data</h2>
      <p>
        Tractsource retrieves parcel geometry and attributes from third-party open GIS sources or
        from files you upload. That data may include owner names and addresses published by counties
        or state feeds. It is provided <strong>as of retrieval time</strong> for cartographic /
        project planning use. It is <strong>not</strong> a legal survey, title commitment, or
        official notice of ownership. Source license terms may limit redistribution; you are
        responsible for compliant use of exports.
      </p>

      <h2>5. Processors &amp; subprocessors</h2>
      <p>We use vendors to run the Services, including approximately:</p>
      <ul>
        <li>
          <strong>Vercel</strong> — hosting / edge
        </li>
        <li>
          <strong>Stripe</strong> — payments
        </li>
        <li>
          <strong>Google</strong> — OAuth sign-in (when you choose it)
        </li>
        <li>
          <strong>Database &amp; object storage</strong> — e.g. PostgreSQL and blob storage for
          files/job artifacts
        </li>
        <li>
          <strong>Resend</strong> (ROWFlow) — transactional email when configured
        </li>
        <li>
          <strong>Map / GIS basemap &amp; boundary providers</strong> — e.g. OpenStreetMap/CARTO
          tiles, Esri public layers for map display
        </li>
      </ul>

      <h2>6. Cookies &amp; sessions</h2>
      <p>
        We use essential cookies/session tokens for login and security (e.g. Auth.js / NextAuth on
        ROWFlow; signed session cookie on Tractsource). We do not use third-party advertising
        cookies. You can clear cookies in your browser; you may need to sign in again.
      </p>

      <h2>7. Data retention</h2>
      <p>
        We retain account and project data while your account is active and as needed to provide the
        Services. Job artifacts and exports may be retained for a limited period for re-download and
        support. You may request deletion of your account/data via{' '}
        <a href="mailto:support@terronex.dev">support@terronex.dev</a>; we will delete or anonymize
        unless we must retain data for legal, security, or billing records.
      </p>

      <h2>8. Security</h2>
      <p>
        We use industry-standard measures appropriate to a small SaaS (HTTPS, hashed passwords,
        access controls, hosted infrastructure). No method of transmission or storage is 100%
        secure.
      </p>

      <h2>9. Your choices</h2>
      <ul>
        <li>Access or update account profile information in-app where available</li>
        <li>Manage billing via Stripe Customer Portal where linked</li>
        <li>Request export or deletion by emailing support</li>
        <li>Stop using the Services and cancel subscriptions</li>
      </ul>
      <p>
        If you are in a jurisdiction with additional privacy rights, contact us to exercise access,
        correction, deletion, or portability requests. We will not discriminate against you for
        exercising those rights.
      </p>

      <h2>10. Children</h2>
      <p>
        The Services are for business/professional use and are not directed to children under 16. We
        do not knowingly collect data from children.
      </p>

      <h2>11. International users</h2>
      <p>
        We currently operate primarily in the United States. If you access the Services from
        elsewhere, you understand your information may be processed in the U.S.
      </p>

      <h2>12. Changes</h2>
      <p>
        We may update this Policy. We will change the effective date and, for material changes,
        provide additional notice when appropriate.
      </p>

      <h2>13. Contact</h2>
      <p>
        Terronex LLC · <a href="mailto:support@terronex.dev">support@terronex.dev</a>
        <br />
        Related: <Link href="/terms">Terms of Service</Link>
      </p>
    </LegalChrome>
  );
}
