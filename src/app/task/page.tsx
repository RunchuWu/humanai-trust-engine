"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import DebugPanel from "@/app/task/components/DebugPanel";
import { getOrCreateAssignment, type Assignment } from "@/lib/conditions";
import type {
  DecisionEvent,
  DecisionType,
  TaskShownEvent,
} from "@/lib/schema";
import { TRIALS } from "@/lib/trials";

const TOTAL_TRIALS = TRIALS.length;
const TASK_SHOWN_MARKER_PREFIX = "humanai_task_shown";

const PARTICIPANT_ID_KEY = "humanai_participant_id";
const CONDITION_ID_KEY = "humanai_condition_id";
const SESSION_ID_KEY = "humanai_session_id";

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

function getTaskShownMarkerKey(sessionId: string, trialIndex: number): string {
  return `${TASK_SHOWN_MARKER_PREFIX}:${sessionId}:${trialIndex}`;
}

function getSessionFlag(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function setSessionFlag(key: string): void {
  try {
    window.sessionStorage.setItem(key, "1");
  } catch {
    // Ignore sessionStorage write errors.
  }
}

function removeSessionFlag(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore sessionStorage write errors.
  }
}

function expireCookie(name: string): void {
  document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function clearAssignmentAndReload(): void {
  expireCookie(PARTICIPANT_ID_KEY);
  expireCookie(CONDITION_ID_KEY);

  try {
    window.localStorage.removeItem(PARTICIPANT_ID_KEY);
    window.localStorage.removeItem(CONDITION_ID_KEY);
  } catch {
    // Ignore localStorage errors.
  }

  try {
    window.sessionStorage.removeItem(SESSION_ID_KEY);

    for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = window.sessionStorage.key(index);
      if (key && key.startsWith(`${TASK_SHOWN_MARKER_PREFIX}:`)) {
        window.sessionStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore sessionStorage errors.
  }

  window.location.reload();
}

export default function TaskPage() {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trialShownAtMsRef = useRef<number | null>(null);
  const decisionLockRef = useRef(false);

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
            : "Failed to initialize assignment.";

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

  const currentTrial = useMemo(() => {
    if (currentTrialIndex < 0 || currentTrialIndex >= TOTAL_TRIALS) {
      return null;
    }

    return TRIALS[currentTrialIndex];
  }, [currentTrialIndex]);

  const isFinished = currentTrialIndex >= TOTAL_TRIALS;

  useEffect(() => {
    if (!assignment || !currentTrial || isFinished) {
      return;
    }

    const markerKey = getTaskShownMarkerKey(
      assignment.sessionId,
      currentTrialIndex,
    );

    if (getSessionFlag(markerKey)) {
      if (trialShownAtMsRef.current === null) {
        trialShownAtMsRef.current = Date.now();
      }
      return;
    }

    const shownAt = Date.now();
    trialShownAtMsRef.current = shownAt;
    setSessionFlag(markerKey);

    const taskShownEvent: TaskShownEvent = {
      event_id: createUuid(),
      participant_id: assignment.participantId,
      condition_id: assignment.conditionId,
      session_id: assignment.sessionId,
      event_type: "task_shown",
      timestamp_ms: shownAt,
      trial_id: currentTrial.trial_id,
      trial_index: currentTrialIndex,
    };

    void postLogEvent(taskShownEvent).catch((error) => {
      removeSessionFlag(markerKey);
      const message =
        error instanceof Error ? error.message : "Failed to log task_shown.";
      setErrorMessage(message);
    });
  }, [assignment, currentTrial, currentTrialIndex, isFinished]);

  async function handleDecision(decision: DecisionType) {
    if (!assignment || !currentTrial || isFinished || decisionLockRef.current) {
      return;
    }

    decisionLockRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);

    const decidedAt = Date.now();
    const shownAt = trialShownAtMsRef.current ?? decidedAt;
    const followAi = decision === "accept";

    const decisionEvent: DecisionEvent = {
      event_id: createUuid(),
      participant_id: assignment.participantId,
      condition_id: assignment.conditionId,
      session_id: assignment.sessionId,
      event_type: "decision",
      timestamp_ms: decidedAt,
      trial_id: currentTrial.trial_id,
      trial_index: currentTrialIndex,
      decision,
      latency_ms: Math.max(0, decidedAt - shownAt),
      ai_reco: currentTrial.ai_reco,
      ground_truth: currentTrial.ground_truth,
      follow_ai: followAi,
      ai_correct: currentTrial.ai_reco === currentTrial.ground_truth,
    };

    try {
      await postLogEvent(decisionEvent);
      trialShownAtMsRef.current = null;
      setCurrentTrialIndex((prev) => prev + 1);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to log decision.";
      setErrorMessage(message);
    } finally {
      decisionLockRef.current = false;
      setIsSubmitting(false);
    }
  }

  const cue = assignment ? CUE_BY_CONDITION[assignment.conditionId] : null;

  return (
    <main style={{ maxWidth: 880, margin: "40px auto", padding: "0 16px 80px" }}>
      <DebugPanel
        assignment={assignment}
        currentTrialIndex={currentTrialIndex}
        totalTrials={TOTAL_TRIALS}
        onReset={clearAssignmentAndReload}
      />

      <h1>Job Screening Recommendation Task</h1>
      <p>
        Review each AI recommendation and choose whether to <strong>Accept</strong>
        {" "}or <strong>Override</strong> it.
      </p>

      {errorMessage ? <p style={{ color: "crimson" }}>Error: {errorMessage}</p> : null}

      {!assignment ? <p>Loading assignment...</p> : null}

      {assignment && isFinished ? (
        <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
          <h2>Task Complete</h2>
          <p>You have finished all {TOTAL_TRIALS} trials.</p>
          <p>
            Export events:
            {" "}
            <a href="/api/export?format=json" target="_blank" rel="noreferrer">
              JSON
            </a>
            {" "}|{" "}
            <a href="/api/export?format=csv" target="_blank" rel="noreferrer">
              CSV
            </a>
          </p>
        </section>
      ) : null}

      {assignment && currentTrial ? (
        <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
          <p style={{ marginTop: 0 }}>
            <strong>Trial:</strong> {currentTrialIndex + 1}/{TOTAL_TRIALS}
          </p>

          <h2 style={{ marginBottom: 8 }}>{currentTrial.job_title}</h2>
          <p>
            <strong>Requirements:</strong> {currentTrial.requirements.join(", ")}
          </p>
          <p>
            <strong>Candidate Summary:</strong> {currentTrial.candidate_summary}
          </p>

          <div
            style={{
              marginTop: 16,
              background: "#f9fafb",
              borderRadius: 8,
              padding: 12,
              border: "1px solid #e5e7eb",
            }}
          >
            <p style={{ marginTop: 0, marginBottom: 8 }}>
              <strong>AI Agent:</strong> {cue?.agentName} ({cue?.tone})
            </p>
            <p style={{ margin: "8px 0" }}>
              <strong>Recommendation:</strong> {currentTrial.ai_reco}
            </p>
            <p style={{ marginBottom: 0 }}>
              <strong>Rationale:</strong>{" "}
              {assignment.conditionId === "A"
                ? currentTrial.rationale_A
                : currentTrial.rationale_B}
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button
              type="button"
              onClick={() => {
                void handleDecision("accept");
              }}
              disabled={isSubmitting}
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => {
                void handleDecision("override");
              }}
              disabled={isSubmitting}
            >
              Override
            </button>
          </div>

          {isSubmitting ? <p>Submitting decision...</p> : null}
        </section>
      ) : null}
    </main>
  );
}
