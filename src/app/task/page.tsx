"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
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
  getConditionConfig,
  getRationaleForCondition,
} from "@/lib/cue-config";
import {
  formatOppositeRecommendationShort,
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
import {
  getAiRecommendationLabel,
  getOppositeRecommendationLabel,
  TRIALS,
} from "@/lib/trials";

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

function TaskPageContent() {
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
  const [mainRevealStage, setMainRevealStage] =
    useState<RevealStage>("situation");
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
    if (screen === "main_task") {
      setMainRevealStage("situation");
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

  function advanceMainReveal() {
    setMainRevealStage((previous) =>
      previous === "situation" ? "evidence" : "ai",
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
    setMainRevealStage("situation");
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
      setMainRevealStage("situation");
      return;
    }

    if (nextScreen === "debrief") {
      setCurrentTrialIndex(TOTAL_TRIALS);
      return;
    }

    setCurrentTrialIndex(0);
    setPracticeDecision(null);
    setMainRevealStage("situation");
  }

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
  const activeCondition = assignment
    ? getConditionConfig(assignment.conditionId)
    : null;
  const progressValue =
    screen === "main_task"
      ? `Trial ${trialDisplayIndex} / ${TOTAL_TRIALS}`
      : `Step ${currentScreenIndex + 1} / ${SCREEN_SEQUENCE.length}`;
  const canContinueConsent = consentAccepted;
  const canContinuePractice = practiceDecision === "accept";
  const showShellSubtitle =
    screen === "welcome" || screen === "instructions" || screen === "consent";

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

      <header className={styles.taskHeader}>
        <div>
          <h1 className={styles.title}>AI Operations Supervision Task</h1>
          {showShellSubtitle ? (
            <p className={styles.subtitle}>
              Review each screen in order, then decide whether to follow the AI
              recommendation.
            </p>
          ) : null}
        </div>
        <p className={styles.taskStatus}>{progressValue}</p>
      </header>

      {errorMessage ? <p className={styles.errorText}>Error: {errorMessage}</p> : null}

      {!assignment ? <p className={styles.infoText}>Initializing assignment...</p> : null}

      {assignment && screen === "welcome" ? (
        <section className={styles.instructionsCard}>
          <h2 className={styles.sectionTitle}>Welcome</h2>
          <p className={styles.bodyText}>
            This study asks you to supervise AI recommendations in
            transportation and drone operations, then decide whether to follow
            or override each recommendation.
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
              Read the operational situation and sensor/context evidence first,
              then focus on the AI recommendation.
            </li>
            <li>
              Use <strong>Follow AI</strong> to take the AI recommendation, or{" "}
              <strong>Choose Opposite</strong> to select the other outcome.
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
              What does Follow AI mean?
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
              <span>Follow AI means use the AI recommendation.</span>
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
              <span>Follow AI means choose the opposite outcome.</span>
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
          <article className={styles.focusCard}>
            <p className={styles.revealEyebrow}>Practice</p>
            <h2 className={styles.focusTitle}>Learn the decision buttons</h2>
            <div className={styles.practiceRecommendation}>
              <p className={styles.aiMessageLead}>AI recommends</p>
              <p className={`${styles.aiRecommendationBadge} ${styles.aiPositionProceed}`}>
                {formatRecommendationShort(
                  PRACTICE_TRIAL.ai_reco,
                  PRACTICE_TRIAL,
                )}
              </p>
            </div>
            <p className={styles.decisionPrompt}>
              Which button means you want to follow this AI recommendation?
            </p>
            <div className={styles.decisionButtons}>
              <button
                type="button"
                className={styles.decisionActionButton}
                onClick={() => {
                  handlePracticeDecision("accept");
                }}
              >
                Follow AI:{" "}
                {formatRecommendationShort(
                  PRACTICE_TRIAL.ai_reco,
                  PRACTICE_TRIAL,
                )}
              </button>
              <button
                type="button"
                className={styles.decisionActionButton}
                onClick={() => {
                  handlePracticeDecision("override");
                }}
              >
                Choose Opposite:{" "}
                {formatOppositeRecommendationShort(
                  PRACTICE_TRIAL.ai_reco,
                  PRACTICE_TRIAL,
                )}
              </button>
            </div>
            {practiceDecision === "accept" ? (
              <p className={styles.practiceSuccess}>
                Correct. Follow AI means selecting the AI recommendation.
              </p>
            ) : null}
            {practiceDecision === "override" ? (
              <p className={styles.practiceError}>
                That button chooses the opposite outcome. Select Follow AI to
                continue.
              </p>
            ) : null}
            <div className={styles.revealActions}>
              <button
                type="button"
                className={styles.primaryAction}
                disabled={!canContinuePractice}
                onClick={handleStartMainTask}
              >
                Start Main Task
              </button>
            </div>
          </article>
        </section>
      ) : null}

      {assignment && screen === "debrief" ? (
        <section className={styles.completionCard}>
          <div className={styles.completionHeader}>
            <div className={styles.completionMark} aria-hidden="true">
              ✓
            </div>
            <div>
              <p className={styles.completionEyebrow}>End of Study</p>
              <h2 className={styles.completionTitle}>Study Complete</h2>
            </div>
          </div>
          <p className={styles.completionText}>
            Thank you. You have finished all {TOTAL_TRIALS} trials, and your
            responses have been recorded.
          </p>
          {!showDebugPanel ? (
            <>
              <p className={styles.completionParticipantNote}>
                There is no further action required. You may now close this
                page.
              </p>
              <p className={styles.completionReviewNote}>
                If you need to correct only your final answer, you can review
                the last trial below.
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
            {mainRevealStage === "situation" ? (
              <article className={styles.focusCard}>
                <p className={styles.revealEyebrow}>Operational Situation</p>
                <h2 className={styles.focusTitle}>
                  {currentTrial.scenario_title}
                </h2>
                <p className={styles.bodyText}>{currentTrial.situation}</p>
                <p className={styles.decisionHint}>
                  Trial type: {currentTrial.trial_type.replace(/_/g, " ")}
                </p>
                <div className={styles.revealActions}>
                  <button
                    type="button"
                    className={styles.primaryAction}
                    onClick={advanceMainReveal}
                  >
                    Continue
                  </button>
                </div>
              </article>
            ) : null}

            {mainRevealStage === "evidence" ? (
              <article className={styles.focusCard}>
                <p className={styles.revealEyebrow}>Sensor / Context Evidence</p>
                <h2 className={styles.focusTitle}>Review the evidence</h2>
                <ul className={styles.requirementsList}>
                  {currentTrial.evidence.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div className={styles.revealActions}>
                  <button
                    type="button"
                    className={styles.primaryAction}
                    onClick={advanceMainReveal}
                  >
                    Continue
                  </button>
                </div>
              </article>
            ) : null}

            {mainRevealStage === "ai" ? (
              <article className={styles.focusCard}>
                <p className={styles.revealEyebrow}>AI Recommendation</p>
                <div className={styles.aiRecommendationBlock}>
                  <p className={styles.aiMessageLead}>AI recommends</p>
                  <p
                    className={`${styles.aiRecommendationBadge} ${
                      currentTrial.ai_reco === "proceed"
                        ? styles.aiPositionProceed
                        : styles.aiPositionReject
                    }`}
                  >
                    {getAiRecommendationLabel(currentTrial)}
                  </p>
                </div>

                <div className={styles.aiBody}>
                  <p className={styles.reasonLabel}>Reason</p>
                  <p className={styles.aiQuote}>
                    {activeCondition
                      ? getRationaleForCondition(currentTrial, activeCondition)
                      : currentTrial.rationale_control}
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
                        : `Follow AI: ${getAiRecommendationLabel(currentTrial)}`}
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
                        : `Choose Opposite: ${getOppositeRecommendationLabel(
                            currentTrial,
                          )}`}
                    </button>
                  </div>
                </footer>
                <p className={styles.decisionHint}>
                  Follow AI means selecting{" "}
                  <strong>{getAiRecommendationLabel(currentTrial)}</strong>.
                  Choose Opposite means selecting{" "}
                  <strong>
                    {getOppositeRecommendationLabel(currentTrial)}
                  </strong>.
                </p>
              </article>
            ) : null}

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

export default function TaskPage() {
  return (
    <Suspense fallback={<main className={styles.page}>Loading study...</main>}>
      <TaskPageContent />
    </Suspense>
  );
}
