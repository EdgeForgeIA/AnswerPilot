export const metadata = { title: "Terms of Service" };

/**
 * TEMPLATE — review before charging real customers.
 * Replace every <Ph> placeholder, then have a lawyer sanity-check it for your
 * jurisdiction. This is a reasonable SaaS baseline, not legal advice.
 */

function Ph({ children }: { children: React.ReactNode }) {
  return <span className="placeholder">[{children}]</span>;
}

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p className="updated">Last updated: <Ph>DATE</Ph></p>

      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your use of AnswerPilot (the
        &ldquo;Service&rdquo;), operated by <Ph>LEGAL ENTITY NAME</Ph> (&ldquo;we&rdquo;,
        &ldquo;us&rdquo;). By creating an account or using the Service, you agree to these Terms
        on behalf of yourself and, if applicable, the organization you represent.
      </p>

      <h2>1. The Service</h2>
      <p>
        AnswerPilot helps you draft responses to security questionnaires using an answer library
        that you provide and control. Drafts are generated from your library content and are
        clearly marked with confidence levels and gaps.
      </p>

      <h2>2. AI-generated drafts require human review</h2>
      <p>
        <strong>Drafts are drafts.</strong> The Service uses AI to generate suggested answers
        grounded in your library. You are solely responsible for reviewing, editing, and approving
        every answer before sending it to a third party. We make no representation that any draft
        is accurate, complete, or suitable for any particular questionnaire, and we are not liable
        for representations you make to your customers or auditors.
      </p>

      <h2>3. Your account and data</h2>
      <ul>
        <li>You are responsible for safeguarding your login credentials.</li>
        <li>
          You retain all rights to the content you upload (questions, answers, library entries).
          You grant us a limited license to process that content solely to provide the Service.
        </li>
        <li>
          We do not use your content to provide answers to any other customer, and we do not use
          it to train our own or third-party AI models.
        </li>
      </ul>

      <h2>4. Acceptable use</h2>
      <p>
        You agree not to misuse the Service, including attempting to access other customers&rsquo;
        data, reverse-engineering the Service, submitting unlawful content, or reselling the
        Service without our written consent.
      </p>

      <h2>5. Subscriptions and billing</h2>
      <ul>
        <li>Paid plans are billed monthly in advance through Stripe.</li>
        <li>You can upgrade, downgrade, or cancel at any time from Settings; downgrades and cancellations take effect at the end of the current billing period.</li>
        <li>Fees are non-refundable except where required by law.</li>
        <li>We may change pricing with at least 30 days&rsquo; notice.</li>
      </ul>

      <h2>6. Availability and support</h2>
      <p>
        We aim for high availability but the Service is provided &ldquo;as is&rdquo; and
        &ldquo;as available&rdquo; without warranties of any kind. Support is provided by email at{" "}
        <Ph>SUPPORT EMAIL</Ph> according to your plan.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, our total liability arising out of or relating to
        the Service is limited to the amounts you paid us in the twelve months preceding the
        claim. We are not liable for indirect, incidental, special, or consequential damages,
        including lost profits or lost deals.
      </p>

      <h2>8. Termination</h2>
      <p>
        You may stop using the Service and delete your account at any time. We may suspend or
        terminate accounts that violate these Terms. Upon termination we will delete your content
        within <Ph>30</Ph> days, except as required for legal compliance.
      </p>

      <h2>9. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. Material changes will be notified by email
        or in-app at least 14 days before they take effect. Continued use after that constitutes
        acceptance.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These Terms are governed by the laws of <Ph>STATE / COUNTRY</Ph>, without regard to
        conflict-of-law rules. Contact: <Ph>LEGAL CONTACT EMAIL</Ph>.
      </p>
    </>
  );
}
