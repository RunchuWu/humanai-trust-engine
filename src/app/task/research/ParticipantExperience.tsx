"use client";
import { useEffect, useRef, useState } from "react";
import { defaultStudy, preset, resolveStimulus } from "@/lib/research/config";
import { isPrediction, type CueDimension, type CueLevel, type PredictionJudgment, type PredictionTrial, type Profile, type PublicDataset, type SessionView, type StudyRecord } from "@/lib/research/types";
import CombinedExperience from "./CombinedExperience";
import ConstraintExperience from "./ConstraintExperience";
import CueControls from "./CueControls";
import StimulusView, { AgentHeader } from "./StimulusView";
import JudgmentForm from "./JudgmentForm";
import { request } from "./client";
import styles from "./research.module.css";

function demoSession(dataset: PublicDataset): SessionView {
  const config = defaultStudy(dataset.trials.map(t => t.id), dataset.version);
  return { id: "preview", participantId: "preview", studyId: "preview", configVersion: 0,
    workflow: "prediction-v1", mode: "fixed", profile: preset("neutral"), allowedDimensions: [],
    locked: true, practiceComplete: false, index: 0, stage: "situation", status: "active",
    order: config.trialOrder, survey: config.survey };
}
export default function ParticipantExperience({ initialDataset, studyId, mode }: {
  initialDataset: PublicDataset; studyId: string | null; mode: "fixed" | "user_set";
}) {
  const [dataset, setDataset] = useState(initialDataset);
  const [study, setStudy] = useState<StudyRecord | null>(null);
  const [session, setSession] = useState<SessionView | null>(null);
  const [setup, setSetup] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(Boolean(studyId));
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [comprehension, setComprehension] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [acknowledged, setAcknowledged] = useState("");
  const [exposureRetry, setExposureRetry] = useState(0);
  const [retry, setRetry] = useState<Record<string, unknown> | null>(null);
  const requestLock = useRef(false);
  const firstPaint = useRef(new Map<string, number>());
  const startToken = useRef<string | null>(null);
  const activeTrial = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!studyId) return;
    let active = true;
    async function load() {
      try {
        const result = await request<{ study: StudyRecord; dataset: PublicDataset }>(`/api/research/studies?id=${encodeURIComponent(studyId!)}`);
        if (!active) return;
        setStudy(result.study); setDataset(result.dataset);
        if (result.dataset.workflow !== "prediction-v1") return;
        const response = await fetch(`/api/research/session?studyId=${encodeURIComponent(studyId!)}`, { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          if (active) { setSession(data.session); setSetup(data.session.profile); }
        } else if (response.status !== 401) throw new Error("Unable to restore the session. Reload to retry.");
      } catch (cause) {
        if (active) { setError(cause instanceof Error ? cause.message : "Unable to load this study."); setLoadFailed(true); }
      } finally { if (active) setLoading(false); }
    }
    void load(); return () => { active = false; };
  }, [studyId]);

  const trial = dataset.trials.find(t => t.id === session?.order[session.index]);
  const inTask = Boolean(dataset.workflow === "prediction-v1" && session?.locked && session.practiceComplete && trial && session.status === "active");
  const exposureKey = inTask ? `${session!.id}:${session!.index}:${session!.stage}` : "";
  const trialId = trial?.id;
  const stage = session?.stage;
  useEffect(() => {
    if (!studyId || !exposureKey || !trialId || !stage) return;
    let active = true;
    const paintedAt = firstPaint.current.get(exposureKey) ?? Date.now();
    firstPaint.current.set(exposureKey, paintedAt);
    request("/api/research/events", { studyId, kind: "shown", trialId, stage, clientShownAt: paintedAt })
      .then(() => { if (active) { setAcknowledged(exposureKey); setError(""); } })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "Unable to record this stage."); });
    return () => { active = false; };
  }, [studyId, exposureKey, trialId, stage, exposureRetry]);
  useEffect(() => { if (inTask) activeTrial.current?.querySelector("h2")?.focus(); }, [inTask, exposureKey]);

  async function send(input: Record<string, unknown>) {
    if (requestLock.current) return;
    requestLock.current = true; setBusy(true); setError(""); setRetry(null);
    if (input.kind === "start") {
      startToken.current ??= Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, "0")).join("");
      input = { ...input, requestToken: startToken.current };
    }
    try {
      if (studyId) {
        const result = await request<{ session: SessionView }>("/api/research/session", { ...input, studyId });
        setSession(result.session); setSetup(result.session.profile);
      } else if (input.kind === "start") setSession(demoSession(dataset));
      else if (session) {
        const judgment = input.judgment as PredictionJudgment;
        if (input.kind === "practice_initial") setSession({ ...session, practiceInitial: judgment, practiceAdvice: dataset.practice as PredictionTrial });
        else if (input.kind === "practice") setSession({ ...session, practiceComplete: true });
        else if (input.kind === "initial") setSession({ ...session, initialJudgment: judgment, stage: "recommendation", advice: trial as PredictionTrial });
        else if (input.kind === "decision") setSession({ ...session, index: session.index + 1, stage: "situation", initialJudgment: undefined, advice: undefined });
        else if (input.kind === "survey") setSession({ ...session, status: "complete" });
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save. Please retry."); setRetry(input); }
    finally { requestLock.current = false; setBusy(false); }
  }

  if (!loading && dataset.workflow === "two-part-v1") return <CombinedExperience dataset={dataset} study={study} studyId={studyId} mode={mode} />;
  if (!loading && dataset.workflow !== "prediction-v1") return <ConstraintExperience initialDataset={dataset} studyId={studyId} mode={mode} />;
  const mixedMaterials = dataset.trials.some(t => isPrediction(t) && t.unit !== "minutes");
  const profile = session?.profile ?? preset("neutral");
  const practice = dataset.practice as PredictionTrial;
  const resolved = resolveStimulus(dataset, practice, profile);
  const order = session?.order ?? study?.config.trialOrder ?? dataset.pilotIds ?? [];
  const survey = session?.survey ?? study?.config.survey ?? defaultStudy(dataset.trials.map(t => t.id), dataset.version).survey;
  const stageReady = !studyId || acknowledged === exposureKey;
  const progress = session ? Math.min(session.index, order.length) : 0;
  const practiceIsFinal = Boolean(session?.practiceInitial);
  const practiceShown = session?.practiceAdvice ?? practice;
  function setupChange(dimension: CueDimension, level: CueLevel) { if (setup) setSetup({ ...setup, levels: { ...setup.levels, [dimension]: level } }); }

  return <main className={`${styles.participant} ${styles[profile.presentation.appearance]}`}>
    <header className={styles.participantHeader}>
      <a href="/task" className={styles.participantBrand}>Everyday forecasts<span>Human–AI research</span></a>
      <span>{!studyId ? "Preview · no data saved" : session?.status === "complete" ? "Complete" : session?.practiceComplete ? `${progress} / ${order.length} predictions` : "Getting started"}</span>
    </header>
    {!studyId ? <div className={styles.demoBanner}>This is a participant demo. <a href="/task?debug=1">Open the researcher workspace ↗</a></div> : null}
    {session?.practiceComplete ? <div className={styles.progress} role="progressbar" aria-label="Predictions completed" aria-valuemin={0} aria-valuemax={order.length} aria-valuenow={progress}><span style={{ width: `${progress / order.length * 100}%` }} /></div> : null}
    {loading ? <section className={styles.introCard}><h1>Loading your study…</h1></section> : null}
    {!loading && !loadFailed && !session ? <section className={styles.introCard}>
      <p className={styles.eyebrow}>EVERYDAY FORECASTS</p><h1>What would you expect?</h1>
      <p className={styles.introLead}>Make a prediction, consider an AI estimate, then decide on your final estimate.</p>
      <div className={styles.introFacts}><span><b>{order.length}</b>predictions</span><span><b>1</b>practice task</span><span><b>{survey.length}</b>experience ratings</span></div>
      <h2>Before you begin</h2>
      <p>You will estimate {mixedMaterials ? "prices, attendance, drink consumption and durations" : "durations"} in constructed everyday situations. Recent observations and context provide clues, but do not determine an exact answer. The actual {mixedMaterials ? "value" : "duration"} is not shown while you work.</p>
      <p>First, enter your own estimate and how confident you are. After saving it, you will see an AI estimate and reasoning. Then enter your final estimate and confidence. Keeping your first estimate, partly adjusting it, or choosing a different value are all possible.</p>
      <p>The AI estimates are fixed, prewritten assessments and can be more or less accurate. There is no live model or conversation, and no outcome feedback between tasks.</p>
      <div className={styles.consent}><h2>Your participation</h2>
        <p>{studyId ? "The study records both estimates, your confidence ratings, any optional explanations, response times, interface configuration and final experience ratings under a random participant ID. It does not ask for your name. You may stop by closing this page; submitted responses remain in the study record. This browser can resume your session." : "This demo does not save estimates or ratings. Published study links record responses under a random participant ID."}</p>
        <label className={styles.checkbox}><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} />I have read this information and agree to participate.</label>
      </div>
      <fieldset className={styles.comprehension}><legend>What should you do before viewing the AI estimate?</legend>
        {[['own', 'Make my own estimate and report my confidence.'], ['copy', 'Wait for the AI and copy its estimate.']].map(([value, text]) => <label className={styles.checkbox} key={value}><input type="radio" name="comprehension" value={value} checked={comprehension === value} onChange={() => setComprehension(value)} />{text}</label>)}
      </fieldset>
      {comprehension === "copy" ? <p className={styles.helper}>We need your independent prediction first. You can keep or change it after considering AI advice.</p> : null}
      <button className={styles.primary} disabled={!consent || comprehension !== "own" || busy} onClick={() => void send({ kind: "start", mode, consent })}>Continue to practice</button>
    </section> : null}
    {session && !session.locked && setup ? <section className={styles.setup}>
      <div><p className={styles.eyebrow}>MAKE IT YOURS</p><h1>Set up your assistant.</h1><p>Available settings stay fixed once you continue.</p>
        <CueControls dataset={dataset} profile={setup} allowed={session.allowedDimensions} onChange={setupChange} />
        <button className={styles.primary} disabled={busy} onClick={() => void send({ kind: "lock", levels: setup.levels })}>Confirm settings</button>
      </div>
      <section className={`${styles.stimulus} ${styles[setup.presentation.appearance]}`}><AgentHeader dataset={dataset} trial={practice} profile={setup} /><p>{resolveStimulus(dataset, practice, setup).welcome}</p></section>
    </section> : null}
    {session?.locked && !session.practiceComplete ? <>
      <section className={styles.practiceIntro}><h1>Try a practice prediction.</h1><p>This practice is not scored. Any estimate in the response range is allowed; you do not have to agree with the AI.</p></section>
      <StimulusView dataset={dataset} trial={practiceShown} profile={profile} stage={practiceIsFinal ? "recommendation" : "situation"} actions={<JudgmentForm key={`practice:${practiceIsFinal}`} trial={practice} phase={practiceIsFinal ? "final" : "initial"} initial={session.practiceInitial} disabled={busy} onSubmit={judgment => void send({ kind: practiceIsFinal ? "practice" : "practice_initial", judgment })} />} />
    </> : null}
    {inTask && trial && isPrediction(trial) && session ? <div className={styles.activeTrial} ref={activeTrial}>
      <p className={styles.trialCounter}>PREDICTION {session.index + 1} OF {order.length} · {session.stage === "situation" ? "YOUR INITIAL ESTIMATE" : "YOUR FINAL ESTIMATE"}</p>
      <StimulusView dataset={dataset} trial={session.advice ?? trial} profile={profile} stage={session.stage} actions={<JudgmentForm key={exposureKey} trial={trial} phase={session.stage === "situation" ? "initial" : "final"} initial={session.initialJudgment} disabled={busy || !stageReady} onSubmit={judgment => void send({ kind: session.stage === "situation" ? "initial" : "decision", trialId: trial.id, judgment, clientDecidedAt: Date.now() })} />} />
    </div> : null}
    {session?.practiceComplete && session.index === order.length && session.status !== "complete" ? <section className={styles.survey}>
      <p className={styles.eyebrow}>YOUR EXPERIENCE</p><h1>How did the interaction feel?</h1><p>Thinking about the assistant you just used, rate each statement.</p><p className={styles.scaleLabels}>1 = Strongly disagree · 4 = Neither agree nor disagree · 7 = Strongly agree</p>
      {session.survey.map(item => <fieldset key={item.id}><legend>{item.text}</legend><div className={styles.rating}>{[1, 2, 3, 4, 5, 6, 7].map(value => <label key={value}><input type="radio" name={item.id} value={value} checked={answers[item.id] === value} onChange={() => setAnswers({ ...answers, [item.id]: value })} /><span>{value}</span></label>)}</div></fieldset>)}
      <button disabled={busy || session.survey.some(item => !answers[item.id])} className={styles.primary} onClick={() => void send({ kind: "survey", answers })}>Finish study</button>
    </section> : null}
    {session?.status === "complete" ? <section className={styles.introCard}>
      <AgentHeader dataset={dataset} trial={practice} profile={profile} /><p className={styles.eyebrow}>COMPLETE</p><h1>Thank you for taking part.</h1><p>{resolved.closing}</p>
      <p>{studyId ? "Your initial and final estimates, confidence ratings and experience ratings have been saved." : "You have finished the demo. No responses were saved."}</p>
      <h2>About this study</h2><p>This study explores how interface presentation relates to reliance on AI estimates. All scenarios, observations, AI assessments and comparison outcomes were constructed in advance. Different presentations use the same underlying observations and estimates.</p>
      <p>Moving toward an AI estimate does not always improve a prediction. A single actual {mixedMaterials ? "outcome" : "duration"} also includes uncertainty; being closer on one case does not establish that a forecasting approach is generally better.</p><p>You can now close this page.</p>
    </section> : null}
    {error ? <div className={styles.error} role="alert"><p>{error}</p>{loadFailed ? <button className={styles.secondary} onClick={() => window.location.reload()}>Reload study</button> : retry ? <button className={styles.secondary} disabled={busy} onClick={() => void send(retry)}>Retry</button> : inTask ? <button className={styles.secondary} onClick={() => setExposureRetry(value => value + 1)}>Retry loading stage</button> : null}</div> : null}
    <footer className={styles.participantFooter}>Human–AI Trust Engine</footer>
  </main>;
}
