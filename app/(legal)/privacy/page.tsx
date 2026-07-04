export const metadata = { title: "Privacy Policy" };

/**
 * TEMPLATE — review before charging real customers.
 * Replace every <Ph> placeholder. If you serve EU/UK customers, you will also
 * want a DPA and to confirm GDPR lawful bases with counsel.
 */

function Ph({ children }: { children: React.ReactNode }) {
  return <span className="placeholder">[{children}]</span>;
}

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="updated">Last updated: <Ph>DATE</Ph></p>

      <p>
        This policy explains what data AnswerPilot (operated by <Ph>LEGAL ENTITY NAME</Ph>)
        collects, how we use it, and the choices you have. The short version: we collect what we
        need to run the product, your questionnaire content stays yours, and we never use it to
        answer anyone else&rsquo;s questionnaires or to train AI models.
      </p>

      <h2>1. Data we collect</h2>
      <ul>
        <li>
          <strong>Account data</strong> — email address, company name, and authentication data,
          to create and secure your workspace.
        </li>
        <li>
          <strong>Content you provide</strong> — answer library entries, questionnaire questions,
          drafts, and approvals. This may include descriptions of your security posture.
        </li>
        <li>
          <strong>Billing data</strong> — handled by Stripe; we store your Stripe customer ID and
          subscription status, never card numbers.
        </li>
        <li>
          <strong>Usage data</strong> — standard logs (IP address, timestamps, pages/endpoints)
          for security and debugging.
        </li>
      </ul>

      <h2>2. How we use AI</h2>
      <p>
        When you draft a questionnaire, the relevant questions and matching entries from your
        answer library are sent to our AI provider (Anthropic) via API to generate a draft.
        Anthropic&rsquo;s API does not use this data to train its models by default. Your library
        is only ever used to answer your own questionnaires — workspaces are isolated with
        row-level security at the database layer.
      </p>

      <h2>3. Subprocessors</h2>
      <p>We share data only with the vendors required to run the Service:</p>
      <ul>
        <li><strong>Supabase / AWS</strong> — database, authentication, and hosting of your content (encrypted at rest and in transit).</li>
        <li><strong>Vercel</strong> — application hosting and delivery.</li>
        <li><strong>Anthropic</strong> — AI draft generation (API; no training on your data by default).</li>
        <li><strong>Stripe</strong> — payment processing.</li>
        <li><Ph>VOYAGE AI — semantic search embeddings (only if enabled)</Ph></li>
        <li><Ph>EMAIL PROVIDER, ANALYTICS — add if/when used</Ph></li>
      </ul>

      <h2>4. Retention and deletion</h2>
      <p>
        Your content is retained while your account is active. If you delete your account or
        request deletion at <Ph>PRIVACY EMAIL</Ph>, we delete your content within <Ph>30</Ph>{" "}
        days, except minimal records required for tax and legal compliance.
      </p>

      <h2>5. Your rights</h2>
      <p>
        Depending on your location, you may have rights to access, correct, export, or delete
        your personal data, and to object to certain processing. Contact{" "}
        <Ph>PRIVACY EMAIL</Ph> and we will respond within 30 days.
      </p>

      <h2>6. Security</h2>
      <p>
        Data is encrypted in transit (TLS) and at rest, workspaces are isolated with Postgres
        row-level security, and billing state can only be modified by verified Stripe webhooks.
        No method of transmission or storage is 100% secure, but we treat your security answers
        with the sensitivity they deserve — they are the product.
      </p>

      <h2>7. Children</h2>
      <p>The Service is for business use and not directed to anyone under 16.</p>

      <h2>8. Changes</h2>
      <p>
        We will notify you of material changes to this policy by email or in-app before they take
        effect.
      </p>

      <h2>9. Contact</h2>
      <p>
        <Ph>LEGAL ENTITY NAME</Ph> · <Ph>ADDRESS</Ph> · <Ph>PRIVACY EMAIL</Ph>
      </p>
    </>
  );
}
