"use client";
import { ANCHORS, DIMENSION_LABELS, namesForProfile, resolveStimulus } from "@/lib/research/config";
import { DIMENSIONS, LEVELS, type CueDimension, type CueLevel, type Profile, type PublicDataset } from "@/lib/research/types";
import { AgentAvatar } from "./StimulusView";
import styles from "./research.module.css";
export default function CueControls({ dataset, profile, onChange, allowed = [...DIMENSIONS] }: { dataset: PublicDataset; profile: Profile; onChange: (dimension: CueDimension, level: CueLevel) => void; allowed?: CueDimension[] }) {
  const anchors = {...ANCHORS, name: namesForProfile(dataset, profile)};
  const resolved = resolveStimulus(dataset, dataset.practice, profile);
  const examples: Record<CueDimension, string> = { name: resolved.name, tone: resolved.tone, avatar: ANCHORS.avatar[profile.levels.avatar / 25], personality: resolved.personality, framing: resolved.welcome, confidence: resolved.confidence };
  return <div className={styles.sliders}>{DIMENSIONS.map((id) => <fieldset className={styles.cue} key={id} disabled={!allowed.includes(id)}>
    <legend>{DIMENSION_LABELS[id]} <span>{profile.levels[id]} · {anchors[id][profile.levels[id] / 25]}</span></legend>
    <input aria-label={DIMENSION_LABELS[id]} aria-valuetext={`${profile.levels[id]}: ${anchors[id][profile.levels[id] / 25]}`} type="range" min="0" max="100" step="25" value={profile.levels[id]} onChange={(e) => onChange(id, Number(e.target.value) as CueLevel)} />
    <div className={styles.ticks}>{LEVELS.map((level) => <button type="button" key={level} aria-label={`${DIMENSION_LABELS[id]} ${level}: ${anchors[id][level / 25]}`} aria-pressed={profile.levels[id] === level} onClick={() => onChange(id, level)}>{level}</button>)}</div>
    <div className={styles.endpoints}><span>{anchors[id][0]}</span><span>{anchors[id][4]}</span></div>
    {id === "avatar" ? <div className={styles.avatarChoices} aria-label="Avatar previews">{LEVELS.map(level => <button key={level} type="button" aria-label={`Choose ${ANCHORS.avatar[level / 25]}`} aria-pressed={profile.levels.avatar === level} onClick={() => onChange("avatar", level)}><AgentAvatar level={level} assetVersion={profile.presentation.assetVersion} /></button>)}</div> : null}
    <p>{examples[id]}</p>{!allowed.includes(id) ? <small>Fixed by the researcher</small> : null}
  </fieldset>)}</div>;
}
