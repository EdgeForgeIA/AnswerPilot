import type { Plan } from "@/types/db";

export type PlanConfig = {
  id: Plan;
  name: string;
  priceMonthly: number;
  questionnaireLimit: number | null; // per account lifetime for free, null = unlimited
  questionsPerQuestionnaire: number;
  kbLimit: number | null;
  blurb: string;
  features: string[];
};

export const PLANS: Record<Plan, PlanConfig> = {
  free: {
    id: "free",
    name: "Starter",
    priceMonthly: 0,
    questionnaireLimit: 1,
    questionsPerQuestionnaire: 20,
    kbLimit: 50,
    blurb: "Prove it works on your next questionnaire.",
    features: [
      "1 questionnaire (up to 20 questions)",
      "50 answer library entries",
      "AI drafts with confidence grading",
      "CSV export",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 149,
    questionnaireLimit: null,
    questionsPerQuestionnaire: 300,
    kbLimit: null,
    blurb: "For teams answering questionnaires every month.",
    features: [
      "Unlimited questionnaires",
      "Up to 300 questions each",
      "Unlimited answer library",
      "Approved answers auto-grow your library",
      "Priority email support",
    ],
  },
  scale: {
    id: "scale",
    name: "Scale",
    priceMonthly: 399,
    questionnaireLimit: null,
    questionsPerQuestionnaire: 1000,
    kbLimit: null,
    blurb: "For security and sales teams under real deal pressure.",
    features: [
      "Everything in Pro",
      "Up to 1,000 questions per questionnaire",
      "Highest generation throughput",
      "Onboarding help importing past questionnaires",
      "Priority support with 1-business-day SLA",
    ],
  },
};

export function planFor(plan: string | null | undefined): PlanConfig {
  if (plan === "pro" || plan === "scale") return PLANS[plan];
  return PLANS.free;
}
