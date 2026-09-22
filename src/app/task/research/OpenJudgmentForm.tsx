"use client";
import { useState } from "react";
import { STANCES, validOpenJudgment } from "@/lib/research/open-judgment";
import type { OpenJudgment, OpenTrial, Stance } from "@/lib/research/types";
import { usePreviewDraft } from "./PreviewDrafts";
import styles from "./research.module.css";
export default function OpenJudgmentForm({trial,phase,initial,disabled,onSubmit}:{trial:OpenTrial;phase:"initial"|"final";initial?:OpenJudgment;disabled:boolean;onSubmit:(value:OpenJudgment)=>void}) {
  const [text,setText]=usePreviewDraft(`${trial.id}:${phase}:text`,"");const [stance,setStance]=usePreviewDraft<Stance|"">(`${trial.id}:${phase}:stance`,"");const [confidence,setConfidence]=usePreviewDraft<number|null>(`${trial.id}:${phase}:confidence`,null);
  const answer={text,stance,confidence};
  return <form className={styles.judgmentForm} onSubmit={e=>{e.preventDefault();if(!disabled&&validOpenJudgment(answer))onSubmit(answer);}}>
    {initial?<details className={styles.initialSummary} data-testid="initial-open-summary"><summary>Review your saved initial view</summary><p className={styles.responseText}>{initial.text}</p><p>{STANCES.find(s=>s.value===initial.stance)?.label} · confidence {initial.confidence}/7</p></details>:null}
    <label className={styles.rationaleLabel}>Your {phase} view and reasons
      <textarea aria-label={`Your ${phase} view and reasons`} required minLength={10} maxLength={1200} rows={5} value={text} onChange={e=>setText(e.target.value)} placeholder="What should happen, and why? You may propose conditions or another approach." />
      <small>{text.length}/1,200 characters · at least 10 characters. Please avoid personal information.</small>
    </label>
    <label className={styles.field}>Your position on this statement: <strong>{trial.proposition}</strong>
      <select aria-label={`Your ${phase} stance`} required value={stance} onChange={e=>setStance(e.target.value as Stance)}><option value="" disabled>Select your position…</option>{STANCES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select>
    </label>
    <fieldset className={styles.judgmentConfidence}><legend>How confident are you in your {phase} judgment?</legend><p>1 = Not at all confident · 7 = Very confident. This is not a test of a correct answer.</p><div className={styles.rating}>{[1,2,3,4,5,6,7].map(value=><label key={value}><input type="radio" name={`open-${phase}-confidence`} value={value} checked={confidence===value} onChange={()=>setConfidence(value)} required/><span>{value}</span></label>)}</div></fieldset>
    <button type="submit" className={styles.primary} disabled={disabled||!validOpenJudgment(answer)}>Save {phase} view</button>
  </form>;
}
export function OpenReflection({final,disabled,onSubmit}:{final?:OpenJudgment;disabled:boolean;onSubmit:(text:string)=>void}) {
  const [text,setText]=useState("");
  return <section className={styles.introCard}><p className={styles.eyebrow}>FINAL VIEW SAVED</p><h2 tabIndex={-1}>A brief reflection</h2>
    {final?<details><summary>Review your final view</summary><p className={styles.responseText}>{final.text}</p></details>:null}
    <label className={styles.rationaleLabel}>Which parts of the AI’s reasoning, if any, did you accept, reject, or qualify?
      <textarea aria-label="Reflection (optional)" rows={3} maxLength={1200} value={text} onChange={e=>setText(e.target.value)} placeholder="You can also say that none of the reasoning influenced your view."/><small>Optional · {text.length}/1,200 characters</small>
    </label><div className={styles.buttonRow}><button disabled={disabled||!text.trim()} className={styles.primary} onClick={()=>onSubmit(text)}>Save reflection and continue</button><button disabled={disabled} className={styles.secondary} onClick={()=>onSubmit("")}>Skip reflection</button></div>
  </section>;
}
