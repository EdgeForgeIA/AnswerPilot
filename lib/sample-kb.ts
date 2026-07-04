/**
 * A realistic starter answer library modeled on a typical B2B SaaS security
 * posture. Loaded on demand so a brand-new user can experience the full
 * flow (paste questionnaire → AI drafts → review → export) in one minute.
 */
export const SAMPLE_KB: Array<{ question: string; answer: string; category: string }> = [
  {
    category: "Certifications",
    question: "Do you hold a SOC 2 report?",
    answer:
      "We maintain a SOC 2 Type II report covering the Security and Availability trust service criteria, audited annually by an independent CPA firm. The current report is available under NDA on request.",
  },
  {
    category: "Certifications",
    question: "Are you ISO 27001 certified?",
    answer:
      "We are not currently ISO 27001 certified. Our security program is aligned to SOC 2 Type II, which covers substantially overlapping controls, and ISO 27001 certification is on our compliance roadmap.",
  },
  {
    category: "Data protection",
    question: "Is customer data encrypted at rest and in transit?",
    answer:
      "Yes. All customer data is encrypted at rest using AES-256 and in transit using TLS 1.2 or higher. Encryption keys are managed through our cloud provider's key management service with automatic rotation.",
  },
  {
    category: "Data protection",
    question: "Where is customer data hosted?",
    answer:
      "Customer data is hosted on AWS in the us-east-1 (N. Virginia) region. EU data residency in eu-west-1 (Ireland) is available on our enterprise plan.",
  },
  {
    category: "Data protection",
    question: "What is your data retention and deletion policy?",
    answer:
      "Customer data is retained for the duration of the contract. On termination, all customer data is deleted from production systems within 30 days and from backups within 90 days. Deletion can be requested earlier in writing.",
  },
  {
    category: "Access control",
    question: "Do you enforce multi-factor authentication for employees?",
    answer:
      "Yes. MFA is enforced for all employees on our identity provider, which gates access to production systems, source control, and internal tools. Hardware security keys are required for engineering and admin roles.",
  },
  {
    category: "Access control",
    question: "How is access to production systems controlled?",
    answer:
      "Production access follows least privilege and is granted via role-based access control through our identity provider. Access requires MFA, is logged, and is reviewed quarterly. Standing production access is limited to the on-call engineering rotation.",
  },
  {
    category: "Application security",
    question: "Do you perform penetration testing?",
    answer:
      "Yes. An independent third party performs a penetration test of our application and infrastructure at least annually. Findings are triaged by severity and remediated under defined SLAs; an executive summary is available under NDA.",
  },
  {
    category: "Application security",
    question: "Describe your secure development lifecycle.",
    answer:
      "All code changes require peer review and pass automated testing, static analysis, and dependency vulnerability scanning in CI before deployment. Engineers complete secure coding training annually, and we maintain a responsible disclosure program.",
  },
  {
    category: "Incident response",
    question: "Do you have a documented incident response plan?",
    answer:
      "Yes. We maintain a documented incident response plan with defined severity levels, escalation paths, and communication procedures. The plan is tested at least annually via tabletop exercises.",
  },
  {
    category: "Incident response",
    question: "What is your breach notification commitment?",
    answer:
      "We notify affected customers of a confirmed data breach involving their data without undue delay, and no later than 72 hours after confirmation, consistent with GDPR requirements and our data processing agreement.",
  },
  {
    category: "Privacy",
    question: "Are you GDPR compliant? Do you sign DPAs?",
    answer:
      "Yes. We act as a processor under GDPR, offer a standard data processing agreement incorporating the EU Standard Contractual Clauses, and maintain a public list of subprocessors with advance notice of changes.",
  },
  {
    category: "Business continuity",
    question: "What are your backup and disaster recovery practices?",
    answer:
      "Production databases are backed up continuously with point-in-time recovery, and encrypted snapshots are taken daily. Our disaster recovery plan targets an RPO of 1 hour and an RTO of 4 hours, and is tested annually.",
  },
  {
    category: "Business continuity",
    question: "What uptime SLA do you offer?",
    answer:
      "We target 99.9% monthly uptime, publish real-time status at our status page, and offer a contractual 99.9% SLA with service credits on enterprise agreements.",
  },
  {
    category: "Vendor management",
    question: "How do you assess your own subprocessors?",
    answer:
      "Subprocessors are reviewed before onboarding for security posture (including SOC 2 or ISO 27001 reports where available) and are bound by data protection agreements. The list of subprocessors is reviewed annually.",
  },
];
