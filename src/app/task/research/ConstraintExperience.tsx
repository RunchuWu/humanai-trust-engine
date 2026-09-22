"use client";
import { useEffect, useRef, useState } from "react";
import { defaultStudy, preset, resolveStimulus } from "@/lib/research/config";
import type { CueDimension, CueLevel, Profile, PublicDataset, SessionView, Stage, StudyRecord } from "@/lib/research/types";
import CueControls from "./CueControls";
import StimulusView, { AgentHeader } from "./StimulusView";
import { request } from "./client";
import styles from "./research.module.css";

function demoSession(dataset: PublicDataset): SessionView {
  return { id: "preview", participantId: "preview", studyId: "preview", configVersion: 0, mode: "fixed", profile: preset("neutral"), allowedDimensions: [], locked: true, practiceComplete: false, index: 0, stage: "situation", status: "active", order: dataset.trials.map((t) => t.id), survey: defaultStudy(dataset.trials.map((t) => t.id), dataset.version).survey };
}
export default function ParticipantExperience({ initialDataset, studyId, mode }: { initialDataset: PublicDataset; studyId: string | null; mode: "fixed" | "user_set" }) {
  const [dataset, setDataset] = useState(initialDataset);
  const [study, setStudy] = useState<StudyRecord | null>(null);
  const [session, setSession] = useState<SessionView | null>(null);
  const [setupProfile, setSetupProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(Boolean(studyId));
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [comprehension, setComprehension] = useState("");
  const [practiceStage, setPracticeStage] = useState<Stage>("situation");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [acknowledged, setAcknowledged] = useState("");
  const [exposureRetry, setExposureRetry] = useState(0);
  const [retry, setRetry] = useState<Record<string, unknown> | null>(null);
  const lock = useRef(false);
  const firstPaint = useRef(new Map<string, number>());
  const startRequestToken = useRef<string | null>(null);
  const stageHeading = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!studyId) return;
    let active = true;
    async function load() {
      try {
        const result = await request<{ study: StudyRecord; dataset: PublicDataset }>(`/api/research/studies?id=${encodeURIComponent(studyId!)}`);
        const response = await fetch(`/api/research/session?studyId=${encodeURIComponent(studyId!)}`, { cache: "no-store" });
        if (!active) return;
        setStudy(result.study); setDataset(result.dataset);
        if (response.ok) { const data = await response.json(); if (!active) return; setSession(data.session); setSetupProfile(data.session.profile); }
        else if (response.status !== 401) throw new Error("Unable to restore the session. Reload to retry.");
      } catch (e) { if (active) { setError(e instanceof Error ? e.message : "Unable to load this study."); setLoadFailed(true); } }
      finally { if (active) setLoading(false); }
    }
    void load(); return () => { active = false; };
  }, [studyId]);
  const currentTrial = dataset.trials.find((t) => t.id === session?.order[session.index]);
  const inTask = Boolean(session?.locked && session.practiceComplete && currentTrial && session.status === "active");
  const exposureKey = inTask ? `${session!.id}:${session!.index}:${session!.stage}` : "";
  useEffect(() => {
    if (!studyId || !exposureKey || !currentTrial || !session) return;
    let active = true;
    const paintedAt = firstPaint.current.get(exposureKey) ?? Date.now();
    firstPaint.current.set(exposureKey, paintedAt);
    request<{ session: SessionView }>("/api/research/events", { studyId, kind: "shown", trialId: currentTrial.id, stage: session.stage, clientShownAt: paintedAt })
      .then(() => { if (active) { setAcknowledged(exposureKey); setError(""); } })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : "Unable to record this stage. Please retry."); });
    return () => { active = false; };
    // Values are deliberately keyed to an exposure, not response object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyId, exposureKey, exposureRetry]);
  useEffect(() => { if (inTask) stageHeading.current?.querySelector("h2")?.focus(); }, [exposureKey, inTask]);
  async function send(input: Record<string, unknown>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setRetry(null);
    if (input.kind === "start") {
      startRequestToken.current ??= Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, "0")).join("");
      input = { ...input, requestToken: startRequestToken.current };
    }
    try {
      if (studyId) {
        const result = await request<{ session: SessionView }>("/api/research/session", { ...input, studyId });
        setSession(result.session); setSetupProfile(result.session.profile);
      } else if (input.kind === "start") { setSession(demoSession(dataset)); }
      else if (session) {
        if (input.kind === "practice") {
          if (input.decision !== "accept") throw new Error("This option meets all three requirements. Try following the recommendation.");
          setSession({ ...session, practiceComplete: true });
        } else if (input.kind === "advance") setSession({ ...session, stage: session.stage === "situation" ? "evidence" : "recommendation" });
        else if (input.kind === "decision") setSession({ ...session, index: session.index + 1, stage: "situation" });
        else if (input.kind === "survey") setSession({ ...session, status: "complete" });
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save. Please retry."); setRetry(input); }
    finally { lock.current = false; setBusy(false); }
  }
  const profile = session?.profile ?? preset("neutral");
  const resolved = resolveStimulus(dataset, dataset.practice, profile);
  const stageReady = !studyId || acknowledged === exposureKey;
  const disabled = busy || !stageReady;
  const progress = session ? Math.min(session.index, session.order.length) : 0;
  function setupChange(dimension: CueDimension, level: CueLevel) { if (setupProfile) setSetupProfile({ ...setupProfile, levels: { ...setupProfile.levels, [dimension]: level } }); }
  return <main className={`${styles.participant} ${styles[profile.presentation.appearance]}`}>
    <header className={styles.participantHeader}><a href="/task" className={styles.participantBrand}>Everyday decisions<span>Human–AI research</span></a><span>{!studyId ? "Preview · no data saved" : session?.status === "complete" ? "Complete" : session?.practiceComplete ? `${progress} / ${session.order.length} decisions` : "Getting started"}</span></header>
    {!studyId ? <div className={styles.demoBanner}>This is a participant demo. <a href="/task?debug=1">Open the researcher workspace ↗</a></div> : null}
    {session?.practiceComplete ? <div className={styles.progress} role="progressbar" aria-label="Decisions completed" aria-valuemin={0} aria-valuemax={session.order.length} aria-valuenow={progress}><span style={{ width: `${progress / session.order.length * 100}%` }} /></div> : null}
    {loading ? <div className={styles.introCard}><h1>Loading your study…</h1></div> : null}
    {!loading && !loadFailed && !session ? <section className={styles.introCard}>
      <p className={styles.eyebrow}>EVERYDAY DECISIONS</p><h1>A few choices.<br />A little perspective.</h1><p className={styles.introLead}>Review everyday options, consider an AI recommendation, and make your own choice.</p>
      <div className={styles.introFacts}><span><b>16</b>decisions</span><span><b>1</b>practice task</span><span><b>6</b>experience ratings</span></div>
      <h2>Before you begin</h2><p>Each task has a proposed option and explicit requirements. Use only the information provided. An option is suitable only when it meets every stated requirement. The AI recommendation can be correct or incorrect.</p><p>You will see fixed, prewritten messages from an AI interface. You can choose whether to follow each recommendation. There is no live conversation.</p>
      <div className={styles.consent}><h2>Your participation</h2><p>{studyId ? "The study records your choices, response times, interface configuration, and six experience ratings under a random participant ID. It does not ask for your name. You may stop by closing this page; submitted responses remain in the study record. Your browser can resume this session." : "This demo does not save choices or ratings. Published study links record responses under a random participant ID."}</p><label className={styles.checkbox}><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />I have read this information and agree to participate.</label></div>
      <fieldset className={styles.comprehension}><legend>When does a proposed option meet the task requirements?</legend>{[["all", "When it meets every stated requirement."], ["ai", "Whenever the AI recommends it."]].map(([value, text]) => <label className={styles.checkbox} key={value}><input type="radio" name="comprehension" value={value} checked={comprehension === value} onChange={() => setComprehension(value)} />{text}</label>)}</fieldset>
      {comprehension === "ai" ? <p className={styles.error}>The AI can make mistakes. Check every stated requirement yourself.</p> : null}
      <button className={styles.primary} disabled={!consent || comprehension !== "all" || busy || Boolean(studyId && !study)} onClick={() => void send({ kind: "start", mode, consent })}>{busy ? "Starting…" : "Continue to practice"}</button>
    </section> : null}
    {session && !session.locked && setupProfile ? <section className={styles.setup}><div><p className={styles.eyebrow}>MAKE IT YOURS</p><h1>Set up your assistant.</h1><p>Adjust the available settings. They will stay fixed once you continue.</p><CueControls dataset={dataset} profile={setupProfile} allowed={session.allowedDimensions} onChange={setupChange} /><button className={styles.primary} disabled={busy} onClick={() => void send({ kind: "lock", levels: setupProfile.levels })}>Confirm settings</button></div><StimulusView dataset={dataset} trial={dataset.practice} profile={setupProfile} stage="recommendation" /></section> : null}
    {session?.locked && !session.practiceComplete ? <><section className={styles.practiceIntro}><AgentHeader dataset={dataset} trial={dataset.practice} profile={profile} /><p>{resolved.welcome}</p><h1>Let’s try a practice decision.</h1><p>This practice is not scored. Review the option and all three requirements before choosing.</p></section><StimulusView dataset={dataset} trial={dataset.practice} profile={profile} stage={practiceStage} actions={practiceStage === "recommendation" ? <><button disabled={busy} className={styles.secondary} onClick={() => void send({ kind: "practice", decision: "override" })}>Choose the other option</button><button disabled={busy} className={styles.primary} onClick={() => void send({ kind: "practice", decision: "accept" })}>Follow the recommendation</button></> : <button className={styles.primary} onClick={() => setPracticeStage(practiceStage === "situation" ? "evidence" : "recommendation")}>Continue</button>} /></> : null}
    {inTask && currentTrial && session ? <div ref={stageHeading} className={styles.activeTrial}><p className={styles.trialCounter}>DECISION {session.index + 1} OF {session.order.length}</p><StimulusView dataset={dataset} trial={currentTrial} profile={profile} stage={session.stage} actions={session.stage === "recommendation" ? <><button disabled={disabled} className={styles.secondary} onClick={() => void send({ kind: "decision", trialId: currentTrial.id, decision: "override", clientDecidedAt: Date.now() })}>Choose the other option</button><button disabled={disabled} className={styles.primary} onClick={() => void send({ kind: "decision", trialId: currentTrial.id, decision: "accept", clientDecidedAt: Date.now() })}>Follow the recommendation</button></> : <button disabled={disabled} className={styles.primary} onClick={() => void send({ kind: "advance", trialId: currentTrial.id, fromStage: session.stage })}>{stageReady ? "Continue" : "Loading…"}</button>} /></div> : null}
    {session?.practiceComplete && session.index === session.order.length && session.status !== "complete" ? <section className={styles.survey}><p className={styles.eyebrow}>YOUR EXPERIENCE</p><h1>How did the interaction feel?</h1><p>Thinking about the assistant you just used, rate each statement.</p><p className={styles.scaleLabels}>1 = Strongly disagree · 4 = Neither agree nor disagree · 7 = Strongly agree</p>{session.survey.map((item) => <fieldset key={item.id}><legend>{item.text}</legend><div className={styles.rating}>{[1, 2, 3, 4, 5, 6, 7].map((value) => <label key={value}><input type="radio" name={item.id} value={value} checked={answers[item.id] === value} onChange={() => setAnswers({ ...answers, [item.id]: value })} /><span>{value}</span></label>)}</div></fieldset>)}<button disabled={busy || session.survey.some((item) => !answers[item.id])} className={styles.primary} onClick={() => void send({ kind: "survey", answers })}>{busy ? "Saving…" : "Finish study"}</button></section> : null}
    {session?.status === "complete" ? <section className={styles.introCard}><AgentHeader dataset={dataset} trial={dataset.practice} profile={profile} /><p className={styles.eyebrow}>COMPLETE</p><h1>Thank you for taking part.</h1><p>{resolved.closing}</p><p>{studyId ? "Your decisions and experience ratings have been saved." : "You have finished the demo. No responses were saved."}</p><h2>About this study</h2><p>This study explores how interface presentation relates to decisions and perceptions of an AI assistant. Names, images, and language were configured in advance. Some recommendations deliberately overlooked a requirement or applied an irrelevant preference. The assistant’s presentation did not change the task facts.</p><p>You can now close this page.</p></section> : null}
    {error ? <div className={styles.error} role="alert"><p>{error}</p>{loadFailed ? <button className={styles.secondary} onClick={() => window.location.reload()}>Reload study</button> : retry ? <button className={styles.secondary} disabled={busy} onClick={() => void send(retry)}>Retry</button> : inTask ? <button className={styles.secondary} onClick={() => setExposureRetry((n) => n + 1)}>Retry loading stage</button> : null}</div> : null}
    <footer className={styles.participantFooter}>Human–AI Trust Engine</footer>
  </main>;
}
