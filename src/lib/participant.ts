export type Condition = "A" | "B";

export interface ParticipantContext {
  participant_id: string;
  condition: Condition;
  assigned_at: string;
}

export const PARTICIPANT_STORAGE_KEY = "humanai_trust_participant_v1";

function getBrowserStorage(): Storage {
  if (typeof window === "undefined") {
    throw new Error(
      "getOrCreateParticipantContext must be called in a browser context.",
    );
  }

  return window.localStorage;
}

function isCondition(value: unknown): value is Condition {
  return value === "A" || value === "B";
}

function isParticipantContext(value: unknown): value is ParticipantContext {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.participant_id === "string" &&
    isCondition(candidate.condition) &&
    typeof candidate.assigned_at === "string"
  );
}

function pickCondition(randomNumber: number = Math.random()): Condition {
  return randomNumber < 0.5 ? "A" : "B";
}

export function createParticipantContext(): ParticipantContext {
  return {
    participant_id: crypto.randomUUID(),
    condition: pickCondition(),
    assigned_at: new Date().toISOString(),
  };
}

export function getOrCreateParticipantContext(
  storage: Storage = getBrowserStorage(),
): ParticipantContext {
  const rawValue = storage.getItem(PARTICIPANT_STORAGE_KEY);

  if (rawValue) {
    try {
      const parsed = JSON.parse(rawValue);
      if (isParticipantContext(parsed)) {
        return parsed;
      }
    } catch {
      // Fallback to a fresh assignment if stored data is malformed.
    }
  }

  const nextContext = createParticipantContext();
  storage.setItem(PARTICIPANT_STORAGE_KEY, JSON.stringify(nextContext));

  return nextContext;
}

export function clearParticipantContext(
  storage: Storage = getBrowserStorage(),
): void {
  storage.removeItem(PARTICIPANT_STORAGE_KEY);
}
