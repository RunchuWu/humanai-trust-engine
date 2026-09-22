"use client";

import { APPEARANCE_LABELS, namesForProfile, preset } from "@/lib/research/config";
import type { Appearance, Profile, PublicDataset } from "@/lib/research/types";
import styles from "./research.module.css";

export default function DemoControls({ dataset, profile, following, connected, onSelect, onFollow, onRestart }: {
  dataset: PublicDataset; profile: Profile; following: boolean; connected: boolean;
  onSelect: (profile: Profile) => void; onFollow: () => void; onRestart: () => void;
}) {
  return <section className={styles.demoControls} aria-label="Participant demo controls">
    <p className={styles.eyebrow}>PARTICIPANT DEMO</p>
    <div className={styles.demoControlHeading}>
      <div><strong data-testid="demo-profile">{APPEARANCE_LABELS[profile.presentation.appearance]} · {namesForProfile(dataset, profile)[profile.levels.name / 25]}</strong>
        <p role="status">{following ? connected ? "Following the researcher panel · changes update here automatically." : "Ready to follow the researcher panel in this browser." : "Local preview · choose Follow researcher to reconnect."}</p></div>
      <a href="/task?debug=1" target="_blank" rel="noopener noreferrer">Researcher panel ↗</a>
    </div>
    <div className={styles.demoControlButtons}>
      {(["cold", "neutral", "friendly"] as Appearance[]).map(appearance => <button key={appearance} type="button" className={styles.secondary} onClick={() => onSelect(preset(appearance))}>Preview {APPEARANCE_LABELS[appearance]}</button>)}
      <button type="button" className={styles.secondary} aria-pressed={following} onClick={onFollow}>Follow researcher</button>
      <button type="button" className={styles.textButton} onClick={onRestart}>Restart demo</button>
    </div>
    <p className={styles.helper}>Scroll inside the phone to continue. No responses are recorded. Your task and typed answers stay in place when the interface changes. AI identity appears after your initial response.</p>
  </section>;
}
