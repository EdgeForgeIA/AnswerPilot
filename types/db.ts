export type Plan = "free" | "pro" | "scale";

export type Org = {
  id: string;
  name: string;
  owner_id: string;
  plan: Plan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  created_at: string;
};

export type KbEntry = {
  id: string;
  org_id: string;
  question: string;
  answer: string;
  category: string | null;
  source: "manual" | "import" | "approved_answer" | "sample";
  created_at: string;
  updated_at: string;
};

export type Questionnaire = {
  id: string;
  org_id: string;
  name: string;
  requester: string | null;
  status: "in_review" | "completed";
  question_count: number;
  created_at: string;
};

export type Confidence = "high" | "medium" | "low";

export type Question = {
  id: string;
  questionnaire_id: string;
  org_id: string;
  position: number;
  question: string;
  ai_answer: string | null;
  final_answer: string | null;
  confidence: Confidence | null;
  status: "pending" | "answered" | "approved" | "flagged";
  source_ids: string[];
  updated_at: string;
};
