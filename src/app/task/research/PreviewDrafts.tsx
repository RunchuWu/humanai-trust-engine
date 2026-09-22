"use client";

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

const Drafts = createContext<Map<string, unknown> | null>(null);

// Keep unsent demo answers when switching between report and conversation renderers.
// This store is in memory only, scoped to one demo run, and disabled for study links.
export default function PreviewDrafts({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [drafts] = useState(() => new Map<string, unknown>());
  return <Drafts.Provider value={enabled ? drafts : null}>{children}</Drafts.Provider>;
}

export function usePreviewDraft<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const drafts = useContext(Drafts);
  const [value, setValue] = useState<T>(() => drafts?.has(key) ? drafts.get(key) as T : initial);
  function update(next: SetStateAction<T>) {
    const current = drafts?.has(key) ? drafts.get(key) as T : value;
    const resolved = typeof next === "function" ? (next as (previous: T) => T)(current) : next;
    drafts?.set(key, resolved);
    setValue(resolved);
  }
  return [value, update];
}
