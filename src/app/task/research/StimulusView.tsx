"use client";
import type { ReactNode } from "react";
import Image from "next/image";
import { resolveStimulus } from "@/lib/research/config";
import { isOpen, isPrediction, type OpenTrial, type PredictionTrial, type OpenJudgment, type PredictionJudgment, type CueLevel, type Profile, type PublicDataset, type PublicTrial, type Stage } from "@/lib/research/types";
import styles from "./research.module.css";

export function AgentAvatar({ level, assetVersion = "avatars-v1" }: { level: CueLevel; assetVersion?: Profile["presentation"]["assetVersion"] }) {
  if (assetVersion === "avatars-v2") return <span className={`${styles.avatar} ${styles.generatedAvatar}`} data-avatar-level={level} data-avatar-version={assetVersion}><Image src={`/research/avatars-v2/${level}.png`} width={56} height={56} sizes="56px" alt={level === 0 ? "Geometric AI system mark" : level === 25 ? "Abstract AI assistant" : level === 50 ? "Anonymous person silhouette" : level === 75 ? "Illustrated assistant with a calm expression" : "Illustrated assistant with a friendly smile"} /></span>;
  return <span className={styles.avatar} data-avatar-level={level}>
    <svg viewBox="0 0 64 64" width="48" height="48" role="img" aria-label={level < 50 ? "Abstract AI identity" : "Illustrated AI identity"}>
      {level === 0 ? <g fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="14" y="14" width="36" height="36" rx="2" /><path d="M23 24h18M23 32h18M23 40h10M32 7v7M32 50v7M7 32h7M50 32h7" /></g> : level === 25 ? <g fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M32 9 39 25 55 32 39 39 32 55 25 39 9 32 25 25Z" /><circle cx="32" cy="32" r="5" /></g> : level === 50 ? <g fill="currentColor" opacity=".8"><circle cx="32" cy="23" r="11" /><path d="M12 56c0-16 9-21 20-21s20 5 20 21Z" /></g> : <g><path fill="#587269" d="M10 64c1-18 10-25 22-25s21 7 22 25" /><path fill="#36393e" d="M16 28C13 9 22 6 32 6s19 6 16 24l-5 12H21Z" /><ellipse cx="32" cy="28" rx="14" ry="18" fill="#e4bd9c" /><path fill="#36393e" d="M17 25C17 9 42 5 47 24c-8-1-12-5-16-10-3 7-8 10-14 11Z" /><g stroke="#3d3630" strokeWidth="1.6" strokeLinecap="round" fill="none"><path d="M25 28h1M38 28h1" />{level === 100 ? <path d="M27 36q5 5 10 0" /> : <path d="M28 37h8" />}</g></g>}
    </svg>
  </span>;
}
export function AgentHeader({ dataset, trial, profile }: { dataset: PublicDataset; trial: PublicTrial; profile: Profile }) {
  const resolved = resolveStimulus(dataset, trial, profile);
  return <div className={styles.agentHeader}><AgentAvatar level={profile.levels.avatar} assetVersion={profile.presentation.assetVersion} /><div><strong data-testid="agent-name">{resolved.name}</strong><span data-testid="agent-role">{resolved.role}</span></div><span className={styles.aiTag}>AI</span></div>;
}
export default function StimulusView({ dataset, trial, profile, stage, actions, compact = false, initialResponse }: { initialResponse?: OpenJudgment | PredictionJudgment; dataset: PublicDataset; trial: PublicTrial; profile: Profile; stage: Stage; actions?: ReactNode; compact?: boolean }) {
  const resolved = resolveStimulus(dataset, trial, profile);
  if (profile.presentation.interfaceVersion === "cards-v3" && profile.presentation.appearance !== "cold" && stage === "recommendation" && (isOpen(trial) && trial.aiViewpoint || isPrediction(trial) && trial.aiEstimate !== undefined)) return <ConversationStimulus dataset={dataset} trial={trial as OpenTrial | PredictionTrial} profile={profile} actions={actions} compact={compact} initialResponse={initialResponse} />;
  if (isOpen(trial)) return <OpenStimulus dataset={dataset} trial={trial} profile={profile} stage={stage} actions={actions} compact={compact} />;
  if (isPrediction(trial)) return <PredictionStimulus dataset={dataset} trial={trial} profile={profile} stage={stage} actions={actions} compact={compact} />;
  return <section className={`${styles.stimulus} ${(profile.presentation.interfaceVersion === "cards-v2" || profile.presentation.interfaceVersion === "cards-v3") ? styles.designed : ""} ${styles[profile.presentation.appearance]} ${compact ? styles.compact : ""}`} data-testid="stimulus" data-interface-version={profile.presentation.interfaceVersion ?? "cards-v1"} data-appearance={profile.presentation.appearance} aria-label={`${trial.title} — ${stage}`}>
    <AgentHeader dataset={dataset} trial={trial} profile={profile} />
    <div className={styles.message}>
      <p className={styles.stagePrompt} data-testid="framing-message">{stage === "situation" ? resolved.situationPrompt : stage === "evidence" ? resolved.evidencePrompt : resolved.recommendationPrompt}</p>
      <p className={styles.eyebrow}>{stage === "situation" ? "01 / Situation" : stage === "evidence" ? "02 / Requirements" : "03 / Recommendation"}</p>
      <h2 tabIndex={-1}>{trial.title}</h2>
      {stage === "situation" ? <><p>{trial.situation}</p><div className={styles.proposal}><span>Proposed option</span><strong>{trial.proposal}</strong></div></> : null}
      {stage === "evidence" ? <><ul className={styles.evidence}>{trial.evidence.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ul><div className={styles.proposal}><span>Proposed option</span><strong>{trial.proposal}</strong></div></> : null}
      {stage === "recommendation" ? <>
        <p className={styles.tone} data-testid="tone-message">{resolved.tone}</p>
        <div className={styles.recommendation}><span>{resolved.name} recommends</span><strong data-testid="recommendation">{resolved.recommendation}</strong><p>{trial.proposal}</p></div>
        <p className={styles.reasonLabel}>Reason</p><p data-testid="core-reason">{resolved.coreReason}</p>
        <p className={styles.certainty} data-testid="confidence-message">{resolved.confidence}</p>
        <p className={styles.personality} data-testid="personality-message">{resolved.personality}</p>
        <details className={styles.recap}><summary>Review the requirements</summary><p>{trial.situation}</p><ul>{trial.evidence.map((item) => <li key={item}>{item}</li>)}</ul></details>
      </> : null}
    </div>
    {actions ? <div className={styles.actions}>{actions}</div> : null}
  </section>;
}

function PredictionStimulus({ dataset, trial, profile, stage, actions, compact }: { dataset: PublicDataset; trial: PredictionTrial; profile: Profile; stage: Stage; actions?: ReactNode; compact: boolean }) {
  const resolved = resolveStimulus(dataset, trial, profile);
  const showAdvice = stage === "recommendation" && trial.aiEstimate !== undefined;
  const context = <><p>{trial.situation}</p><div className={styles.observations}><p>{trial.historyLabel}</p><ol className={trial.historyStyle === "cards" ? styles.historyCards : trial.historyStyle === "bars" ? styles.historyBars : undefined} aria-label={trial.historyLabel}>{trial.history.map((value, index) => <li key={index}>
    {trial.historyStyle === "bars" ? <span className={styles.historyBarLabel}>Event {index + 1}</span> : null}
    <strong>{value}</strong><span>{trial.unit}</span>
    {trial.historyStyle === "bars" ? <span className={styles.historyBarTrack} aria-hidden="true"><span style={{ width: `${value / trial.estimateRange.max * 100}%` }} /></span> : null}
    {trial.historyDetails?.[index] ? <small>{trial.historyDetails[index]}</small> : null}
  </li>)}</ol></div><ul className={styles.evidence}>{trial.evidence.map((item, index) => <li key={index}><span>{index + 1}</span>{item}</li>)}</ul></>;
  return <section className={`${styles.stimulus} ${showAdvice && (profile.presentation.interfaceVersion === "cards-v2" || profile.presentation.interfaceVersion === "cards-v3") ? styles.designed : ""} ${styles[showAdvice ? profile.presentation.appearance : "neutral"]} ${compact ? styles.compact : ""}`} data-testid="stimulus" data-interface-version={profile.presentation.interfaceVersion ?? "cards-v1"} data-appearance={showAdvice ? profile.presentation.appearance : "neutral"}>
    {showAdvice ? <AgentHeader dataset={dataset} trial={trial} profile={profile} /> : <p className={styles.eyebrow}>YOUR INDEPENDENT PREDICTION</p>}
    <div className={styles.message}>
      <h2 tabIndex={-1}>{trial.title}</h2>
      {showAdvice ? <>
        <p className={styles.stagePrompt} data-testid="framing-message">{resolved.recommendationPrompt}</p>
        <p className={styles.tone} data-testid="tone-message">{resolved.tone}</p>
        <div className={styles.recommendation}><span>{resolved.name} estimates</span><strong data-testid="recommendation">{resolved.recommendation}</strong></div>
        <p className={styles.reasonLabel}>Reasoning</p><p data-testid="core-reason">{resolved.coreReason}</p>
        <p className={styles.certainty} data-testid="confidence-message">{resolved.confidence}</p>
        <p className={styles.personality} data-testid="personality-message">{resolved.personality}</p>
        <details className={styles.recap}><summary>Review the original observations</summary>{context}</details>
      </> : <>{context}<p className={styles.question}>{trial.question}</p><p className={styles.helper}>These are observations from similar situations. The actual {trial.unit === "minutes" ? "duration" : "value"} for this case is not shown.</p></>}
    </div>
    {actions ? <div className={styles.judgmentActions}>{actions}</div> : null}
  </section>;
}

function OpenStimulus({dataset,trial,profile,stage,actions,compact}:{dataset:PublicDataset;trial:OpenTrial;profile:Profile;stage:Stage;actions?:ReactNode;compact:boolean}) {
  const r=resolveStimulus(dataset,trial,profile), show=stage!=="situation"&&Boolean(trial.aiViewpoint);
  return <section className={`${styles.stimulus} ${show && (profile.presentation.interfaceVersion === "cards-v2" || profile.presentation.interfaceVersion === "cards-v3") ? styles.designed : ""} ${styles[show?profile.presentation.appearance:"neutral"]} ${compact?styles.compact:""}`} data-testid="stimulus" data-interface-version={profile.presentation.interfaceVersion ?? "cards-v1"} data-appearance={show?profile.presentation.appearance:"neutral"}>
    {show?<AgentHeader dataset={dataset} trial={trial} profile={profile}/>:<p className={styles.eyebrow}>YOUR INDEPENDENT VIEW</p>}
    <div className={styles.message}><h2 tabIndex={-1}>{trial.title}</h2>
      {show?<><p className={styles.stagePrompt} data-testid="framing-message">{r.recommendationPrompt}</p><p className={styles.tone} data-testid="tone-message">{r.tone}</p><div className={styles.recommendation}><span>{r.name} suggests</span><strong data-testid="recommendation">{r.recommendation}</strong></div><p className={styles.reasonLabel}>Reasoning</p><p data-testid="core-reason">{r.coreReason}</p><p className={styles.certainty} data-testid="confidence-message">{r.confidence}</p><p className={styles.personality} data-testid="personality-message">{r.personality}</p><details className={styles.recap}><summary>Review the situation</summary><p>{trial.situation}</p><p>{trial.question}</p></details></>:<><p>{trial.situation}</p><p className={styles.question}>{trial.question}</p><p className={styles.helper}>There is no single correct answer. You can suggest a conditional or alternative approach.</p></>}
    </div>{actions?<div className={styles.judgmentActions}>{actions}</div>:null}
  </section>;
}


function ConversationStimulus({dataset,trial,profile,actions,compact,initialResponse}: {dataset:PublicDataset;trial:OpenTrial|PredictionTrial;profile:Profile;actions?:ReactNode;compact:boolean;initialResponse?:OpenJudgment|PredictionJudgment}) {
  const resolved=resolveStimulus(dataset,trial,profile);
  const initialText=initialResponse ? "text" in initialResponse ? initialResponse.text : `${initialResponse.estimate} ${isPrediction(trial)?trial.unit:""}${initialResponse.rationale ? ` — ${initialResponse.rationale}` : ""}` : null;
  return <section className={`${styles.stimulus} ${styles.designed} ${styles.messaging} ${styles[profile.presentation.appearance]} ${compact?styles.compact:""}`} data-testid="stimulus" data-interface-version="cards-v3" data-appearance={profile.presentation.appearance} aria-label={`${trial.title} — AI advice`}>
    <AgentHeader dataset={dataset} trial={trial} profile={profile}/>
    <div className={styles.conversationTopic}><h2 tabIndex={-1}>{trial.title}</h2></div>
    {initialText?<div className={styles.priorTurn} data-testid="conversation-initial"><span>You · initial response</span><p>{initialText}</p><small>Your confidence: {initialResponse!.confidence}/7</small></div>:null}
    <div className={styles.thread}>
      <p className={styles.conversationFraming} data-testid="framing-message">{resolved.recommendationPrompt}</p>
      <div className={styles.message}>
        <p className={styles.tone} data-testid="tone-message">{resolved.tone}</p>
        <div className={styles.recommendation}><span>{resolved.name} {isOpen(trial)?"suggests":"estimates"}</span><strong data-testid="recommendation">{resolved.recommendation}</strong></div>
        <p className={styles.reasonLabel}>Reasoning</p><p data-testid="core-reason">{resolved.coreReason}</p>
      </div>
      <div className={styles.followupMessage}><p className={styles.certainty} data-testid="confidence-message">{resolved.confidence}</p><p className={styles.personality} data-testid="personality-message">{resolved.personality}</p></div>
      <details className={styles.recap}><summary>{isOpen(trial)?"Review the situation":"Review the original observations"}</summary><p>{trial.situation}</p>{isPrediction(trial)?<><p>{trial.historyLabel}</p><ol>{trial.history.map((value,index)=><li key={index}>{value} {trial.unit}{trial.historyDetails?.[index]?` · ${trial.historyDetails[index]}`:""}</li>)}</ol><ul>{trial.evidence.map(item=><li key={item}>{item}</li>)}</ul></>:null}<p>{trial.question}</p></details>
    </div>
    {actions?<div className={styles.judgmentActions}>{actions}</div>:null}
  </section>;
}
