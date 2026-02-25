"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import DebugPanel from "@/app/task/components/DebugPanel";
import { getOrCreateAssignment, type Assignment } from "@/lib/conditions";
import type {
  DecisionEvent,
  DecisionType,
  TaskShownEvent,
} from "@/lib/schema";
import { TRIALS } from "@/lib/trials";

import styles from "./task.module.css";

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
  const searchParams = useSearchParams();
  const showDebugPanel = searchParams.get("debug") === "1";

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
  const trialDisplayIndex = Math.min(currentTrialIndex + 1, TOTAL_TRIALS);
  const progressPercent = Math.max(
    0,
    Math.min(100, (trialDisplayIndex / TOTAL_TRIALS) * 100),
  );

  const recommendationBadgeClass =
    currentTrial?.ai_reco === "proceed"
      ? styles.recommendationProceed
      : styles.recommendationReject;

  return (
    <main className={styles.page}>
      {showDebugPanel ? (
        <DebugPanel
          assignment={assignment}
          currentTrialIndex={currentTrialIndex}
          totalTrials={TOTAL_TRIALS}
          onReset={clearAssignmentAndReload}
        />
      ) : null}

      <header className={styles.headerCard}>
        <h1 className={styles.title}>Job Screening Study</h1>
        <p className={styles.subtitle}>
          You will review a candidate, then review an AI recommendation, then
          choose Accept (follow AI) or Override.
        </p>
        <div className={styles.progressWrap}>
          <div className={styles.progressMeta}>
            <span className={styles.progressLabel}>Progress</span>
            <span className={styles.progressValue}>Trial {trialDisplayIndex} / 10</span>
          </div>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuenow={trialDisplayIndex}
            aria-valuemin={1}
            aria-valuemax={TOTAL_TRIALS}
            aria-label="Trial progress"
          >
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      <section className={styles.instructionsCard}>
        <h2 className={styles.sectionTitle}>Instructions</h2>
        <ul className={styles.instructionsList}>
          <li>
            Read the role, requirements, and candidate summary on the left.
          </li>
          <li>
            Focus on the AI recommendation area first, then decide whether to
            Accept or Override.
          </li>
          <li>
            We record your decision and response time (latency) for each trial.
          </li>
        </ul>
      </section>

      {errorMessage ? <p className={styles.errorText}>Error: {errorMessage}</p> : null}

      {!assignment ? <p className={styles.infoText}>Initializing assignment...</p> : null}

      {assignment && isFinished ? (
        <section className={styles.completionCard}>
          <h2 className={styles.completionTitle}>Study Complete</h2>
          <p className={styles.completionText}>
            Thank you. You have finished all {TOTAL_TRIALS} trials.
          </p>
          <div className={styles.completionActions}>
            <a
              className={styles.secondaryAction}
              href="/api/export?format=json"
              target="_blank"
              rel="noreferrer"
            >
              Download JSON
            </a>
            <a
              className={styles.secondaryAction}
              href="/api/export?format=csv"
              target="_blank"
              rel="noreferrer"
            >
              Download CSV
            </a>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={clearAssignmentAndReload}
            >
              Restart Study
            </button>
          </div>
        </section>
      ) : null}

      {assignment && currentTrial ? (
        <section className={styles.taskGrid}>
          <article className={styles.leftColumn}>
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>Role</h2>
              <p className={styles.jobTitle}>{currentTrial.job_title}</p>
            </div>

            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>Requirements</h2>
              <ul className={styles.requirementsList}>
                {currentTrial.requirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>Candidate Summary</h2>
              <p className={styles.bodyText}>{currentTrial.candidate_summary}</p>
            </div>
          </article>

          <article className={styles.aiCard}>
            <header className={styles.aiHeader}>
              <div>
                <p className={styles.aiLabel}>AI Recommendation</p>
                <h2 className={styles.aiAgentName}>{cue?.agentName}</h2>
                <p className={styles.aiTone}>Tone: {cue?.tone}</p>
              </div>
              <span className={`${styles.recommendationBadge} ${recommendationBadgeClass}`}>
                {currentTrial.ai_reco === "proceed" ? "Proceed" : "Reject"}
              </span>
            </header>

            <div className={styles.aiBody}>
              <h3 className={styles.rationaleTitle}>Rationale</h3>
              <p className={styles.bodyText}>
                {assignment.conditionId === "A"
                  ? currentTrial.rationale_A
                  : currentTrial.rationale_B}
              </p>
            </div>

            <footer className={styles.aiActions}>
              <button
                type="button"
                className={styles.primaryAction}
                onClick={() => {
                  void handleDecision("accept");
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Accept"}
              </button>
              <button
                type="button"
                className={styles.secondaryActionButton}
                onClick={() => {
                  void handleDecision("override");
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Override"}
              </button>
            </footer>
          </article>
        </section>
      ) : null}
    </main>
  );
}
