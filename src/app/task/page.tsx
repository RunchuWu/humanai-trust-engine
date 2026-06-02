"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import DebugPanel from "@/app/task/components/DebugPanel";
import {
  clearStoredAssignment,
  forceConditionAssignment,
  getOrCreateAssignment,
  type Assignment,
  type ConditionId,
} from "@/lib/conditions";
import {
  CONDITION_CUES,
  formatRecommendation,
  formatRecommendationShort,
  PRACTICE_TRIAL,
  SCREEN_SEQUENCE,
  type ExperimentScreen,
  type RevealStage,
} from "@/lib/experiment-config";
import type {
  DecisionEvent,
  DecisionType,
  TaskShownEvent,
} from "@/lib/schema";
import { TRIALS } from "@/lib/trials";

import styles from "./task.module.css";

const TOTAL_TRIALS = TRIALS.length;
const TASK_SHOWN_MARKER_PREFIX = "humanai_task_shown";

function shortenId(id: string): string {
  if (id.length <= 14) {
    return id;
  }

  return `${id.slice(0, 8)}...${id.slice(-4)}`;
}

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

function clearTaskShownMarkers(): void {
  try {
    for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = window.sessionStorage.key(index);
      if (key && key.startsWith(`${TASK_SHOWN_MARKER_PREFIX}:`)) {
        window.sessionStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore sessionStorage errors.
  }
}

function clearAssignmentAndReload(): void {
  clearStoredAssignment();
  clearTaskShownMarkers();

  window.location.reload();
}

export default function TaskPage() {
  const searchParams = useSearchParams();
  const showDebugPanel = searchParams.get("debug") === "1";

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [screen, setScreen] = useState<ExperimentScreen>("welcome");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [comprehensionDecisionAnswer, setComprehensionDecisionAnswer] =
    useState("");
  const [comprehensionLoggingAnswer, setComprehensionLoggingAnswer] =
    useState("");
  const [showComprehensionFeedback, setShowComprehensionFeedback] =
    useState(false);
  const [practiceDecision, setPracticeDecision] = useState<DecisionType | null>(
    null,
  );
  const [practiceRevealStage, setPracticeRevealStage] =
    useState<RevealStage>("job");
  const [mainRevealStage, setMainRevealStage] = useState<RevealStage>("job");
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingRetryDecision, setPendingRetryDecision] =
    useState<DecisionType | null>(null);
  const [latestDecisionByTrial, setLatestDecisionByTrial] = useState<
    Record<number, DecisionType>
  >({});

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
    if (screen === "practice_trial") {
      setPracticeRevealStage("job");
    }
  }, [screen]);

  useEffect(() => {
    if (screen === "main_task") {
      setMainRevealStage("job");
    }
  }, [screen, currentTrialIndex]);

  useEffect(() => {
    if (!assignment || screen !== "main_task" || !currentTrial || isFinished) {
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
  }, [assignment, screen, currentTrial, currentTrialIndex, isFinished]);

  async function handleDecision(decision: DecisionType) {
    if (
      !assignment ||
      screen !== "main_task" ||
      !currentTrial ||
      isFinished ||
      decisionLockRef.current
    ) {
      return;
    }

    decisionLockRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);
    setPendingRetryDecision(null);

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
      setPendingRetryDecision(null);
      setLatestDecisionByTrial((previous) => ({
        ...previous,
        [currentTrialIndex]: decision,
      }));
      if (currentTrialIndex + 1 >= TOTAL_TRIALS) {
        setCurrentTrialIndex(TOTAL_TRIALS);
        setScreen("debrief");
      } else {
        setCurrentTrialIndex((prev) => prev + 1);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to log decision.";
      setPendingRetryDecision(decision);
      setErrorMessage(message);
    } finally {
      decisionLockRef.current = false;
      setIsSubmitting(false);
    }
  }

  function handleGoBackTrial() {
    if (isSubmitting || currentTrialIndex <= 0 || screen !== "main_task") {
      return;
    }

    setErrorMessage(null);
    setPendingRetryDecision(null);
    trialShownAtMsRef.current = null;
    setCurrentTrialIndex((prev) => Math.max(0, prev - 1));
  }

  function handleReviewLastTrial() {
    setScreen("main_task");
    setErrorMessage(null);
    setPendingRetryDecision(null);
    trialShownAtMsRef.current = null;
    setCurrentTrialIndex(Math.max(0, TOTAL_TRIALS - 1));
  }

  function moveToScreen(nextScreen: ExperimentScreen) {
    setScreen(nextScreen);
    setErrorMessage(null);
    setPendingRetryDecision(null);
  }

  function handleComprehensionContinue() {
    const answersAreCorrect =
      comprehensionDecisionAnswer === "accept_follows_ai" &&
      comprehensionLoggingAnswer === "decision_and_time";

    setShowComprehensionFeedback(!answersAreCorrect);

    if (answersAreCorrect) {
      moveToScreen("practice_trial");
    }
  }

  function handlePracticeDecision(decision: DecisionType) {
    setPracticeDecision(decision);
  }

  function advancePracticeReveal() {
    setPracticeRevealStage((previous) =>
      previous === "job" ? "candidate" : "ai",
    );
  }

  function advanceMainReveal() {
    setMainRevealStage((previous) =>
      previous === "job" ? "candidate" : "ai",
    );
  }

  function handleStartMainTask() {
    setCurrentTrialIndex(0);
    trialShownAtMsRef.current = null;
    moveToScreen("main_task");
  }

  function resetFlowForDebug(nextAssignment: Assignment) {
    clearTaskShownMarkers();
    setAssignment(nextAssignment);
    setScreen("welcome");
    setConsentAccepted(false);
    setComprehensionDecisionAnswer("");
    setComprehensionLoggingAnswer("");
    setShowComprehensionFeedback(false);
    setPracticeDecision(null);
    setPracticeRevealStage("job");
    setMainRevealStage("job");
    setCurrentTrialIndex(0);
    setLatestDecisionByTrial({});
    setErrorMessage(null);
    setPendingRetryDecision(null);
    trialShownAtMsRef.current = null;
  }

  function handleForceCondition(conditionId: ConditionId) {
    try {
      resetFlowForDebug(forceConditionAssignment(conditionId));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to force condition.";
      setErrorMessage(message);
    }
  }

  function handleDebugScreenJump(nextScreen: ExperimentScreen) {
    setScreen(nextScreen);
    setErrorMessage(null);
    setPendingRetryDecision(null);
    trialShownAtMsRef.current = null;

    if (nextScreen === "main_task") {
      setCurrentTrialIndex((previous) =>
        previous >= TOTAL_TRIALS ? 0 : Math.max(0, previous),
      );
      setMainRevealStage("job");
      return;
    }

    if (nextScreen === "debrief") {
      setCurrentTrialIndex(TOTAL_TRIALS);
      return;
    }

    setCurrentTrialIndex(0);
    setPracticeDecision(null);
    setPracticeRevealStage("job");
    setMainRevealStage("job");
  }

  const cue = assignment ? CONDITION_CUES[assignment.conditionId] : null;
  const participantIdShort = assignment
    ? shortenId(assignment.participantId)
    : "-";
  const sessionIdShort = assignment ? shortenId(assignment.sessionId) : "-";
  const currentScreenIndex = SCREEN_SEQUENCE.indexOf(screen);
  const trialDisplayIndex =
    screen === "main_task" || screen === "debrief"
      ? Math.min(currentTrialIndex + 1, TOTAL_TRIALS)
      : 0;
  const currentTrialSavedDecision = latestDecisionByTrial[currentTrialIndex];
  const progressValue =
    screen === "main_task"
      ? `Trial ${trialDisplayIndex} / ${TOTAL_TRIALS}`
      : `Step ${currentScreenIndex + 1} / ${SCREEN_SEQUENCE.length}`;
  const progressNow =
    screen === "main_task"
      ? trialDisplayIndex
      : Math.max(0, currentScreenIndex + 1);
  const progressMax =
    screen === "main_task" ? TOTAL_TRIALS : SCREEN_SEQUENCE.length;
  const progressPercent = Math.max(0, Math.min(100, (progressNow / progressMax) * 100));
  const canContinueConsent = consentAccepted;
  const canContinuePractice = practiceDecision !== null;

  return (
    <main className={styles.page}>
      {showDebugPanel ? (
        <DebugPanel
          assignment={assignment}
          currentScreen={screen}
          currentTrialIndex={currentTrialIndex}
          totalTrials={TOTAL_TRIALS}
          screens={SCREEN_SEQUENCE}
          onForceCondition={handleForceCondition}
          onJumpToScreen={handleDebugScreenJump}
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
            <span className={styles.progressValue}>{progressValue}</span>
          </div>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuenow={progressNow}
            aria-valuemin={1}
            aria-valuemax={progressMax}
            aria-label="Study progress"
          >
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      {errorMessage ? <p className={styles.errorText}>Error: {errorMessage}</p> : null}

      {!assignment ? <p className={styles.infoText}>Initializing assignment...</p> : null}

      {assignment && screen === "welcome" ? (
        <section className={styles.instructionsCard}>
          <h2 className={styles.sectionTitle}>Welcome</h2>
          <p className={styles.bodyText}>
            This study asks you to review job-screening recommendations and make
            a decision on each case.
          </p>
          <div className={styles.instructionsActions}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={() => {
                moveToScreen("consent");
              }}
            >
              Continue
            </button>
          </div>
        </section>
      ) : null}

      {assignment && screen === "consent" ? (
        <section className={styles.instructionsCard}>
          <h2 className={styles.sectionTitle}>Consent</h2>
          <p className={styles.bodyText}>
            Your responses, response times, assigned condition, and trial
            metadata will be recorded for research analysis. Do not enter any
            personal information into the task.
          </p>
          <div className={styles.readinessCard}>
            <label className={styles.readinessItem}>
              <input
                className={styles.readinessCheckbox}
                type="checkbox"
                checked={consentAccepted}
                onChange={(event) => {
                  setConsentAccepted(event.target.checked);
                }}
              />
              <span>I understand and agree to continue.</span>
            </label>
          </div>
          <div className={styles.instructionsActions}>
            <button
              type="button"
              className={styles.primaryAction}
              disabled={!canContinueConsent}
              onClick={() => {
                moveToScreen("instructions");
              }}
            >
              Continue
            </button>
          </div>
        </section>
      ) : null}

      {assignment && screen === "instructions" ? (
        <section className={styles.instructionsCard}>
          <h2 className={styles.sectionTitle}>Instructions</h2>
          <ul className={styles.instructionsList}>
            <li>
              Complete 10 trials and make one decision per trial.
            </li>
            <li>
              Read role/candidate context first, then focus on AI recommendation.
            </li>
            <li>
              We log your decision and response time for research analysis.
            </li>
          </ul>
          <div className={styles.instructionsActions}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={() => {
                moveToScreen("comprehension_check");
              }}
            >
              Continue
            </button>
          </div>
        </section>
      ) : null}

      {assignment && screen === "comprehension_check" ? (
        <section className={styles.instructionsCard}>
          <h2 className={styles.sectionTitle}>Comprehension Check</h2>
          <fieldset className={styles.questionGroup}>
            <legend className={styles.questionTitle}>
              What does Accept mean?
            </legend>
            <label className={styles.readinessItem}>
              <input
                type="radio"
                name="decisionMeaning"
                value="accept_follows_ai"
                checked={comprehensionDecisionAnswer === "accept_follows_ai"}
                onChange={(event) => {
                  setComprehensionDecisionAnswer(event.target.value);
                }}
              />
              <span>Accept means follow the AI recommendation.</span>
            </label>
            <label className={styles.readinessItem}>
              <input
                type="radio"
                name="decisionMeaning"
                value="accept_disagrees"
                checked={comprehensionDecisionAnswer === "accept_disagrees"}
                onChange={(event) => {
                  setComprehensionDecisionAnswer(event.target.value);
                }}
              />
              <span>Accept means choose differently from the AI.</span>
            </label>
          </fieldset>
          <fieldset className={styles.questionGroup}>
            <legend className={styles.questionTitle}>
              What is recorded during the main task?
            </legend>
            <label className={styles.readinessItem}>
              <input
                type="radio"
                name="loggingMeaning"
                value="decision_and_time"
                checked={comprehensionLoggingAnswer === "decision_and_time"}
                onChange={(event) => {
                  setComprehensionLoggingAnswer(event.target.value);
                }}
              />
              <span>My decision and response time for each trial.</span>
            </label>
            <label className={styles.readinessItem}>
              <input
                type="radio"
                name="loggingMeaning"
                value="personal_notes"
                checked={comprehensionLoggingAnswer === "personal_notes"}
                onChange={(event) => {
                  setComprehensionLoggingAnswer(event.target.value);
                }}
              />
              <span>Personal notes I type into the page.</span>
            </label>
          </fieldset>
          {showComprehensionFeedback ? (
            <p className={styles.startHint}>
              Please review the instructions and select the correct answers to
              continue.
            </p>
          ) : null}
          <div className={styles.instructionsActions}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={handleComprehensionContinue}
            >
              Continue
            </button>
          </div>
        </section>
      ) : null}

      {assignment && screen === "practice_trial" ? (
        <section className={styles.trialLayout}>
          <div className={styles.practiceBanner}>
            Practice trial. This screen helps you learn the decision controls
            before the main task begins.
          </div>

          <div className={styles.revealStack}>
            <article className={`${styles.card} ${styles.revealCard}`}>
              <p className={styles.revealEyebrow}>Step 1</p>
              <h2 className={styles.sectionTitle}>Role & Requirements</h2>
              <p className={styles.jobTitle}>{PRACTICE_TRIAL.job_title}</p>
              <ul className={styles.requirementsList}>
                {PRACTICE_TRIAL.requirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            {(practiceRevealStage === "candidate" ||
              practiceRevealStage === "ai") ? (
              <article className={`${styles.card} ${styles.revealCard}`}>
                <p className={styles.revealEyebrow}>Step 2</p>
                <h2 className={styles.sectionTitle}>Candidate Summary</h2>
                <p className={styles.bodyText}>
                  {PRACTICE_TRIAL.candidate_summary}
                </p>
              </article>
            ) : null}

            {practiceRevealStage === "ai" ? (
              <article className={styles.aiRecommendationCard}>
                <p className={styles.revealEyebrow}>Step 3</p>
                <div className={styles.aiRecommendationHeader}>
                  <div>
                    <h2 className={styles.aiAgentName}>{cue?.agentName}</h2>
                    <p className={styles.aiMessageLead}>AI recommendation</p>
                  </div>
                  <p
                    className={`${styles.aiRecommendationBadge} ${styles.aiPositionProceed}`}
                  >
                    {formatRecommendation(PRACTICE_TRIAL.ai_reco)}
                  </p>
                </div>
                <div className={styles.aiBody}>
                  <p className={styles.aiQuote}>{PRACTICE_TRIAL.rationale}</p>
                </div>

                <footer className={styles.aiActions}>
                  {practiceDecision ? (
                    <p className={styles.savedDecisionHint}>
                      Practice decision selected:{" "}
                      <strong>{practiceDecision}</strong>.
                    </p>
                  ) : null}
                  <p className={styles.decisionPrompt}>
                    Your choice below is about whether to follow this AI
                    recommendation.
                  </p>
                  <div className={styles.decisionButtons}>
                    <button
                      type="button"
                      className={styles.decisionActionButton}
                      onClick={() => {
                        handlePracticeDecision("accept");
                      }}
                    >
                      Accept AI Recommendation:{" "}
                      {formatRecommendationShort(PRACTICE_TRIAL.ai_reco)}
                    </button>
                    <button
                      type="button"
                      className={styles.decisionActionButton}
                      onClick={() => {
                        handlePracticeDecision("override");
                      }}
                    >
                      Override AI Recommendation
                    </button>
                  </div>
                </footer>
                <p className={styles.decisionHint}>
                  Accept means follow the AI choice:{" "}
                  <strong>{formatRecommendationShort(PRACTICE_TRIAL.ai_reco)}</strong>.
                  Override means choose the other screening outcome.
                </p>
              </article>
            ) : null}

            <div className={styles.revealActions}>
              {practiceRevealStage !== "ai" ? (
                <button
                  type="button"
                  className={styles.primaryAction}
                  onClick={advancePracticeReveal}
                >
                  {practiceRevealStage === "job"
                    ? "Show Candidate Summary"
                    : "Show AI Recommendation"}
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.primaryAction}
                  disabled={!canContinuePractice}
                  onClick={handleStartMainTask}
                >
                  Start Main Task
                </button>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {assignment && screen === "debrief" ? (
        <section className={styles.completionCard}>
          <h2 className={styles.completionTitle}>Study Complete</h2>
          <p className={styles.completionText}>
            Thank you. You have finished all {TOTAL_TRIALS} trials.
          </p>
          {!showDebugPanel ? (
            <>
              <p className={styles.completionParticipantNote}>
                Your responses have been recorded. You can close this page, or
                review the last trial to revise an answer.
              </p>
              <div className={styles.completionParticipantActions}>
                <button
                  type="button"
                  className={styles.secondaryActionButton}
                  onClick={handleReviewLastTrial}
                >
                  Review Last Trial
                </button>
              </div>
            </>
          ) : null}

          <div className={styles.completionStats}>
            <div className={styles.statChip}>
              <p className={styles.statLabel}>Trials Completed</p>
              <p className={styles.statValue}>
                {TOTAL_TRIALS}/{TOTAL_TRIALS}
              </p>
            </div>
            {showDebugPanel ? (
              <div className={styles.statChip}>
                <p className={styles.statLabel}>Participant</p>
                <p className={styles.statValue}>{participantIdShort}</p>
              </div>
            ) : null}
            {showDebugPanel ? (
              <div className={styles.statChip}>
                <p className={styles.statLabel}>Session</p>
                <p className={styles.statValue}>{sessionIdShort}</p>
              </div>
            ) : null}
          </div>

          {showDebugPanel ? (
            <div className={styles.exportGrid}>
              <article className={styles.exportCard}>
                <h3 className={styles.exportTitle}>JSON Export</h3>
                <p className={styles.exportText}>
                  Event-level JSON array (`task_shown` + `decision`), sorted by
                  `timestamp_ms`.
                </p>
                <a
                  className={styles.secondaryAction}
                  href="/api/export?format=json"
                  target="_blank"
                  rel="noreferrer"
                >
                  Download JSON
                </a>
              </article>
              <article className={styles.exportCard}>
                <h3 className={styles.exportTitle}>CSV Export</h3>
                <p className={styles.exportText}>
                  Event-level CSV rows with one event per row, sorted by
                  `timestamp_ms`.
                </p>
                <a
                  className={styles.secondaryAction}
                  href="/api/export?format=csv"
                  target="_blank"
                  rel="noreferrer"
                >
                  Download CSV
                </a>
              </article>
            </div>
          ) : null}

          {showDebugPanel ? (
            <div className={styles.completionActions}>
              <button
                type="button"
                className={styles.primaryAction}
                onClick={clearAssignmentAndReload}
              >
                Restart Study
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {assignment && screen === "main_task" && currentTrial ? (
        <section className={styles.trialLayout}>
          <div className={styles.revealStack}>
            <article className={`${styles.card} ${styles.revealCard}`}>
              <p className={styles.revealEyebrow}>Step 1</p>
              <h2 className={styles.sectionTitle}>Role & Requirements</h2>
              <p className={styles.jobTitle}>{currentTrial.job_title}</p>
              <ul className={styles.requirementsList}>
                {currentTrial.requirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            {(mainRevealStage === "candidate" || mainRevealStage === "ai") ? (
              <article className={`${styles.card} ${styles.revealCard}`}>
                <p className={styles.revealEyebrow}>Step 2</p>
                <h2 className={styles.sectionTitle}>Candidate Summary</h2>
                <p className={styles.bodyText}>{currentTrial.candidate_summary}</p>
              </article>
            ) : null}

            {mainRevealStage === "ai" ? (
              <article className={styles.aiRecommendationCard}>
                <p className={styles.revealEyebrow}>Step 3</p>
                <div className={styles.aiRecommendationHeader}>
                  <div>
                    <h2 className={styles.aiAgentName}>{cue?.agentName}</h2>
                    <p className={styles.aiMessageLead}>AI recommendation</p>
                  </div>
                  <p
                    className={`${styles.aiRecommendationBadge} ${
                      currentTrial.ai_reco === "proceed"
                        ? styles.aiPositionProceed
                        : styles.aiPositionReject
                    }`}
                  >
                    {formatRecommendation(currentTrial.ai_reco)}
                  </p>
                </div>

                <div className={styles.aiBody}>
                  <p className={styles.aiQuote}>
                    {assignment.conditionId === "A"
                      ? currentTrial.rationale_A
                      : currentTrial.rationale_B}
                  </p>
                </div>

                <footer className={styles.aiActions}>
                  {currentTrialSavedDecision ? (
                    <p className={styles.savedDecisionHint}>
                      Latest saved decision for this trial:{" "}
                      <strong>{currentTrialSavedDecision}</strong>. Submit again
                      to update it.
                    </p>
                  ) : null}
                  <p className={styles.decisionPrompt}>
                    Your choice below is about whether to follow this AI
                    recommendation.
                  </p>
                  <div className={styles.decisionButtons}>
                    <button
                      type="button"
                      className={styles.decisionActionButton}
                      onClick={() => {
                        void handleDecision("accept");
                      }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? "Submitting..."
                        : `Accept AI Recommendation: ${formatRecommendationShort(
                            currentTrial.ai_reco,
                          )}`}
                    </button>
                    <button
                      type="button"
                      className={styles.decisionActionButton}
                      onClick={() => {
                        void handleDecision("override");
                      }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? "Submitting..."
                        : "Override AI Recommendation"}
                    </button>
                  </div>
                </footer>
                <p className={styles.decisionHint}>
                  Accept means follow the AI choice:{" "}
                  <strong>{formatRecommendationShort(currentTrial.ai_reco)}</strong>.
                  Override means choose the other screening outcome.
                </p>
              </article>
            ) : null}

            <div className={styles.revealActions}>
              {mainRevealStage !== "ai" ? (
                <button
                  type="button"
                  className={styles.primaryAction}
                  onClick={advanceMainReveal}
                >
                  {mainRevealStage === "job"
                    ? "Show Candidate Summary"
                    : "Show AI Recommendation"}
                </button>
              ) : null}
            </div>

            {currentTrialIndex > 0 ? (
              <div className={styles.backRow}>
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={handleGoBackTrial}
                  disabled={isSubmitting}
                >
                  Back to Previous Trial
                </button>
              </div>
            ) : null}
            {pendingRetryDecision ? (
              <div className={styles.retryNotice}>
                <p className={styles.retryText}>
                  Submission failed. Retry the same decision.
                </p>
                <button
                  type="button"
                  className={styles.retryButton}
                  disabled={isSubmitting}
                  onClick={() => {
                    void handleDecision(pendingRetryDecision);
                  }}
                >
                  Retry {pendingRetryDecision === "accept" ? "Accept" : "Override"}
                </button>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}
