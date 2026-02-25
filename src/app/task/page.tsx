"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { getOrCreateAssignment, type Assignment } from "@/lib/conditions";
import type {
  DecisionEvent,
  DecisionType,
  TaskShownEvent,
} from "@/lib/schema";
import { TRIALS } from "@/lib/trials";

const FIRST_TRIAL_INDEX = 0;
const FIRST_TRIAL = TRIALS[FIRST_TRIAL_INDEX];

const CUE_BY_CONDITION = {
  A: {
    agentName: "Assistant",
    tone: "formal",
  },
  B: {
    agentName: "Mia",
    tone: "conversational",
  },
} as const;

function createUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // Fallback UUID v4-like generator for older browsers.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

async function postLogEvent(event: TaskShownEvent | DecisionEvent): Promise<void> {
  const response = await fetch("/api/log", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(event),
  });

  const body = (await response.json().catch(() => null)) as
    | { ok?: boolean; message?: string }
    | null;

  if (!response.ok || !body?.ok) {
    throw new Error(body?.message ?? "Failed to log event.");
  }
}

export default function TaskPage() {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [submittedDecision, setSubmittedDecision] = useState<DecisionType | null>(
    null,
  );

  const shownAtRef = useRef<number | null>(null);
  const hasLoggedTaskShownRef = useRef(false);

  useEffect(() => {
    let isActive = true;

    const timer = window.setTimeout(() => {
      try {
        const nextAssignment = getOrCreateAssignment();
        if (isActive) {
          setAssignment(nextAssignment);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to create assignment context.";
        if (isActive) {
          setErrorMessage(message);
        }
      }
    }, 0);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!assignment || hasLoggedTaskShownRef.current) {
      return;
    }

    hasLoggedTaskShownRef.current = true;

    const shownAt = Date.now();
    shownAtRef.current = shownAt;

    const taskShownEvent: TaskShownEvent = {
      event_id: createUuid(),
      participant_id: assignment.participantId,
      condition_id: assignment.conditionId,
      session_id: assignment.sessionId,
      event_type: "task_shown",
      timestamp_ms: shownAt,
      trial_id: FIRST_TRIAL.trial_id,
      trial_index: FIRST_TRIAL_INDEX,
    };

    void postLogEvent(taskShownEvent).catch((error) => {
      const message =
        error instanceof Error ? error.message : "Failed to log task_shown.";
      setErrorMessage(message);
    });
  }, [assignment]);

  const cue = assignment ? CUE_BY_CONDITION[assignment.conditionId] : null;

  async function handleDecision(decision: DecisionType) {
    if (!assignment || submitState === "saving" || submitState === "saved") {
      return;
    }

    setSubmitState("saving");
    setErrorMessage(null);

    const decidedAt = Date.now();
    const shownAt = shownAtRef.current ?? decidedAt;
    const followAi = decision === "accept";

    const decisionEvent: DecisionEvent = {
      event_id: createUuid(),
      participant_id: assignment.participantId,
      condition_id: assignment.conditionId,
      session_id: assignment.sessionId,
      event_type: "decision",
      timestamp_ms: decidedAt,
      trial_id: FIRST_TRIAL.trial_id,
      trial_index: FIRST_TRIAL_INDEX,
      decision,
      latency_ms: Math.max(0, decidedAt - shownAt),
      ai_reco: FIRST_TRIAL.ai_reco,
      ground_truth: FIRST_TRIAL.ground_truth,
      follow_ai: followAi,
      ai_correct: FIRST_TRIAL.ai_reco === FIRST_TRIAL.ground_truth,
    };

    try {
      await postLogEvent(decisionEvent);
      setSubmittedDecision(decision);
      setSubmitState("saved");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to log decision.";
      setErrorMessage(message);
      setSubmitState("idle");
    }
  }

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: "0 16px" }}>
      <h1>/task Click Validation</h1>
      <p>Single-trial validation page for `/api/log` decision instrumentation.</p>

      {assignment ? (
        <section style={{ marginBottom: 24 }}>
          <p>
            <strong>participantId:</strong> {assignment.participantId}
          </p>
          <p>
            <strong>conditionId:</strong> {assignment.conditionId}
          </p>
          <p>
            <strong>sessionId:</strong> {assignment.sessionId}
          </p>
          <p>
            <strong>agentName:</strong> {cue?.agentName} / <strong>tone:</strong>{" "}
            {cue?.tone}
          </p>
        </section>
      ) : (
        <p>Loading assignment...</p>
      )}

      <section style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
        <h2 style={{ marginTop: 0 }}>{FIRST_TRIAL.job_title}</h2>
        <p>
          <strong>Requirements:</strong> {FIRST_TRIAL.requirements.join(", ")}
        </p>
        <p>
          <strong>Candidate summary:</strong> {FIRST_TRIAL.candidate_summary}
        </p>
        <p>
          <strong>AI recommendation:</strong> {FIRST_TRIAL.ai_reco}
        </p>
        <p>
          <strong>Rationale:</strong>{" "}
          {assignment?.conditionId === "B"
            ? FIRST_TRIAL.rationale_B
            : FIRST_TRIAL.rationale_A}
        </p>

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button
            type="button"
            onClick={() => {
              void handleDecision("accept");
            }}
            disabled={!assignment || submitState !== "idle"}
          >
            Accept AI
          </button>
          <button
            type="button"
            onClick={() => {
              void handleDecision("override");
            }}
            disabled={!assignment || submitState !== "idle"}
          >
            Override AI
          </button>
        </div>
      </section>

      {submitState === "saving" ? <p>Saving decision...</p> : null}
      {submitState === "saved" ? (
        <p>
          Decision saved: <strong>{submittedDecision}</strong>. Check
          `data/events.jsonl`.
        </p>
      ) : null}
      {errorMessage ? <p style={{ color: "crimson" }}>Error: {errorMessage}</p> : null}

      <p>
        <Link href="/">Back to home</Link>
      </p>
    </main>
  );
}
