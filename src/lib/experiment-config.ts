import type { Condition } from "@/lib/participant";

export type EventType = "task_shown" | "decision";
export type DecisionType = "accept" | "override";
export type Recommendation = "proceed" | "reject";
export type ConditionTone = "formal" | "conversational";

export interface BaseEvent {
  event_id: string;
  participant_id: string;
  condition_id: Condition;
  session_id: string;
  event_type: EventType;
  timestamp_ms: number;
}

export interface TaskShownEvent extends BaseEvent {
  event_type: "task_shown";
  trial_id: string;
  trial_index: number;
}

export interface DecisionEvent extends BaseEvent {
  event_type: "decision";
  trial_id: string;
  trial_index: number;
  decision: DecisionType;
  latency_ms: number;
  ai_reco: Recommendation;
  ground_truth: Recommendation;
  follow_ai: boolean;
  ai_correct: boolean;
}

export type BehavioralEvent = TaskShownEvent | DecisionEvent;

export interface ConditionCue {
  agentName: string;
  tone: ConditionTone;
}

export const CONDITION_CUES: Record<Condition, ConditionCue> = {
  A: {
    agentName: "Assistant",
    tone: "formal",
  },
  B: {
    agentName: "Mia",
    tone: "conversational",
  },
};

export interface TrialDefinition {
  trial_id: string;
  job_title: string;
  requirements: string[];
  candidate_summary: string;
  ground_truth: Recommendation;
  ai_reco: Recommendation;
  rationale_A: string;
  rationale_B: string;
}

export const TRIALS: TrialDefinition[] = [
  {
    trial_id: "trial_01",
    job_title: "Data Analyst",
    requirements: [
      "SQL proficiency",
      "Python for analysis",
      "Dashboard reporting",
    ],
    candidate_summary:
      "3 years in analytics. Built weekly KPI dashboards and automated reporting scripts in Python.",
    ground_truth: "proceed",
    ai_reco: "proceed",
    rationale_A:
      "The candidate demonstrates direct alignment with the required analytics stack and reporting responsibilities.",
    rationale_B:
      "Looks like a solid match. They already do SQL, Python, and dashboard work in a similar setup.",
  },
  {
    trial_id: "trial_02",
    job_title: "Backend Engineer",
    requirements: [
      "Go development",
      "Distributed systems experience",
      "Service performance tuning",
    ],
    candidate_summary:
      "4 years building REST APIs in Node.js. Limited exposure to Go and no production distributed systems ownership.",
    ground_truth: "reject",
    ai_reco: "proceed",
    rationale_A:
      "The candidate has backend experience and appears adaptable enough to transition into the listed stack.",
    rationale_B:
      "They have backend fundamentals, so they could probably ramp into Go with support.",
  },
  {
    trial_id: "trial_03",
    job_title: "Customer Support Lead",
    requirements: [
      "2+ years people management",
      "Escalation handling",
      "KPI coaching",
    ],
    candidate_summary:
      "6 years in support operations, including ownership of escalation queues and mentoring new hires.",
    ground_truth: "proceed",
    ai_reco: "reject",
    rationale_A:
      "The profile lacks explicit management scope, which introduces risk for a lead-level appointment.",
    rationale_B:
      "Good support background, but I do not see enough clear team-lead ownership yet.",
  },
  {
    trial_id: "trial_04",
    job_title: "UX Researcher",
    requirements: [
      "Qualitative interviews",
      "Usability testing",
      "Research synthesis",
    ],
    candidate_summary:
      "Ran 20+ moderated interviews, built usability studies, and delivered synthesis reports to product teams.",
    ground_truth: "proceed",
    ai_reco: "reject",
    rationale_A:
      "The candidate does not present sufficient evidence of rigorous end-to-end research ownership.",
    rationale_B:
      "There is relevant work here, but the full research ownership signal feels a bit thin.",
  },
  {
    trial_id: "trial_05",
    job_title: "DevOps Engineer",
    requirements: [
      "Terraform",
      "Kubernetes",
      "On-call incident response",
    ],
    candidate_summary:
      "Operated production Kubernetes clusters, wrote Terraform modules, and participated in weekly on-call rotations.",
    ground_truth: "proceed",
    ai_reco: "proceed",
    rationale_A:
      "The technical profile satisfies all listed operational requirements for this role.",
    rationale_B:
      "Strong fit across infra tooling and real on-call production responsibility.",
  },
  {
    trial_id: "trial_06",
    job_title: "Compliance Officer",
    requirements: [
      "Internal audits",
      "Regulatory controls",
      "Policy documentation",
    ],
    candidate_summary:
      "Handled policy updates and documentation but has minimal direct audit ownership.",
    ground_truth: "reject",
    ai_reco: "reject",
    rationale_A:
      "Core compliance scope is present, but direct audit ownership appears insufficient for this position.",
    rationale_B:
      "They know policy docs, but the audit depth for this role is still missing.",
  },
  {
    trial_id: "trial_07",
    job_title: "Sales Operations Analyst",
    requirements: [
      "Forecast modeling",
      "CRM workflow automation",
      "Pipeline reporting",
    ],
    candidate_summary:
      "Built CRM automations and reporting templates; collaborated with sales leadership on monthly forecasting.",
    ground_truth: "proceed",
    ai_reco: "reject",
    rationale_A:
      "The profile does not demonstrate enough quantitative forecasting rigor for the expected level.",
    rationale_B:
      "Useful ops skills are there, but the forecast depth seems lighter than required.",
  },
  {
    trial_id: "trial_08",
    job_title: "iOS Developer",
    requirements: [
      "Swift",
      "App Store release lifecycle",
      "Unit and UI testing",
    ],
    candidate_summary:
      "Primary experience is Android (Kotlin). Built one internal iOS prototype, no production iOS release ownership.",
    ground_truth: "reject",
    ai_reco: "proceed",
    rationale_A:
      "The candidate has mobile engineering foundations and may transition effectively to iOS responsibilities.",
    rationale_B:
      "Good mobile base overall, so they might ramp on Swift quickly.",
  },
  {
    trial_id: "trial_09",
    job_title: "Product Manager",
    requirements: [
      "Cross-functional delivery",
      "Roadmap prioritization",
      "Experiment metrics",
    ],
    candidate_summary:
      "Led multiple launches with design and engineering, prioritized quarterly roadmap, and tracked metric outcomes.",
    ground_truth: "proceed",
    ai_reco: "proceed",
    rationale_A:
      "The candidate has strong evidence of ownership across planning, execution, and measurable outcomes.",
    rationale_B:
      "Strong PM signal: cross-team execution plus clear metrics follow-through.",
  },
  {
    trial_id: "trial_10",
    job_title: "QA Automation Engineer",
    requirements: [
      "Test automation",
      "CI pipeline integration",
      "Regression strategy",
    ],
    candidate_summary:
      "Manual QA focus with basic scripting; no sustained ownership of CI-integrated automation.",
    ground_truth: "reject",
    ai_reco: "reject",
    rationale_A:
      "The profile does not yet meet the automation depth expected by the role definition.",
    rationale_B:
      "Mostly manual QA background, so the automation bar for this role is not met yet.",
  },
];
