"use client";

import { useMemo, useSyncExternalStore } from "react";
import { isLevels } from "@/lib/research/config";
import type { Profile } from "@/lib/research/types";

// Preview presentation only. Never store researcher credentials or participant answers.
export const DEMO_PROFILE_KEY = "humanai.research.demo-profile.v1";
const CHANGED = "humanai-demo-profile-changed";

function snapshot(): string | null {
  try { return window.localStorage.getItem(DEMO_PROFILE_KEY); } catch { return null; }
}

function subscribe(notify: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key === DEMO_PROFILE_KEY || event.key === null) notify();
  };
  window.addEventListener("storage", storage);
  window.addEventListener(CHANGED, notify);
  window.addEventListener("focus", notify);
  document.addEventListener("visibilitychange", notify);
  return () => {
    window.removeEventListener("storage", storage);
    window.removeEventListener(CHANGED, notify);
    window.removeEventListener("focus", notify);
    document.removeEventListener("visibilitychange", notify);
  };
}

const emptySnapshot = () => null;
const noSubscription = () => () => {};

export function readDemoProfile(raw: string | null, datasetVersion: string): Profile | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (data?.version !== 1 || data.datasetVersion !== datasetVersion) return null;
    const p = data.profile;
    if (!p || typeof p.id !== "string" || !/^[a-z][a-z0-9_-]{0,39}$/.test(p.id)
      || typeof p.label !== "string" || !p.label.trim() || p.label.length > 80
      || !isLevels(p.levels) || p.levels.confidence !== 50) return null;
    const presentation = p.presentation;
    if (!presentation || !["cold", "neutral", "friendly"].includes(presentation.appearance)
      || !["avatars-v1", "avatars-v2"].includes(presentation.assetVersion)
      || (presentation.interfaceVersion !== undefined && !["cards-v1", "cards-v2", "cards-v3"].includes(presentation.interfaceVersion))
      || (presentation.nameVersion !== undefined && !["names-v1", "names-v2"].includes(presentation.nameVersion))) return null;
    return { id: p.id, label: p.label, levels: { ...p.levels }, presentation: {
      appearance: presentation.appearance, assetVersion: presentation.assetVersion,
      ...(presentation.interfaceVersion ? { interfaceVersion: presentation.interfaceVersion } : {}),
      ...(presentation.nameVersion ? { nameVersion: presentation.nameVersion } : {}),
    } };
  } catch { return null; }
}

export function publishDemoProfile(datasetVersion: string, profile: Profile): boolean {
  try {
    const value = JSON.stringify({ version: 1, datasetVersion, profile });
    if (snapshot() !== value) {
      window.localStorage.setItem(DEMO_PROFILE_KEY, value);
      window.dispatchEvent(new Event(CHANGED));
    }
    return true;
  } catch { return false; }
}

export function useDemoProfile(datasetVersion: string, enabled: boolean): Profile | null {
  const raw = useSyncExternalStore(enabled ? subscribe : noSubscription, enabled ? snapshot : emptySnapshot, emptySnapshot);
  return useMemo(() => readDemoProfile(raw, datasetVersion), [raw, datasetVersion]);
}
