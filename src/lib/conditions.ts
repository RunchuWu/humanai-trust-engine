export type ConditionId = "A" | "B";

export interface Assignment {
  participantId: string;
  conditionId: ConditionId;
  sessionId: string;
}

const PARTICIPANT_ID_KEY = "humanai_participant_id";
const CONDITION_ID_KEY = "humanai_condition_id";
const SESSION_ID_KEY = "humanai_session_id";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function assertBrowserContext(): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("getOrCreateAssignment must be called in a browser context.");
  }
}

function parseConditionId(value: string | null): ConditionId | null {
  if (value === "A" || value === "B") {
    return value;
  }

  return null;
}

function createUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // Fallback for environments without crypto.randomUUID.
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function assignConditionId(): ConditionId {
  return Math.random() < 0.5 ? "A" : "B";
}

function getCookie(name: string): string | null {
  const encodedName = `${encodeURIComponent(name)}=`;
  const pairs = document.cookie ? document.cookie.split("; ") : [];

  for (const pair of pairs) {
    if (pair.startsWith(encodedName)) {
      return decodeURIComponent(pair.slice(encodedName.length));
    }
  }

  return null;
}

function setCookie(name: string, value: string): void {
  const encodedName = encodeURIComponent(name);
  const encodedValue = encodeURIComponent(value);

  document.cookie = `${encodedName}=${encodedValue}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

function getLocalStorageItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setLocalStorageItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore write failures (e.g. storage disabled).
  }
}

function setSessionStorageItem(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Ignore write failures (e.g. storage disabled).
  }
}

function readPersistentParticipantId(): string | null {
  return getCookie(PARTICIPANT_ID_KEY) ?? getLocalStorageItem(PARTICIPANT_ID_KEY);
}

function readPersistentConditionId(): ConditionId | null {
  const raw = getCookie(CONDITION_ID_KEY) ?? getLocalStorageItem(CONDITION_ID_KEY);
  return parseConditionId(raw);
}

function persistAssignmentIdentity(
  participantId: string,
  conditionId: ConditionId,
): void {
  let cookieReadBackValid = false;

  try {
    setCookie(PARTICIPANT_ID_KEY, participantId);
    setCookie(CONDITION_ID_KEY, conditionId);

    cookieReadBackValid =
      getCookie(PARTICIPANT_ID_KEY) === participantId &&
      getCookie(CONDITION_ID_KEY) === conditionId;
  } catch {
    cookieReadBackValid = false;
  }

  if (!cookieReadBackValid) {
    setLocalStorageItem(PARTICIPANT_ID_KEY, participantId);
    setLocalStorageItem(CONDITION_ID_KEY, conditionId);
  }
}

let currentPageSessionId: string | null = null;

function getOrCreateSessionId(): string {
  if (currentPageSessionId) {
    return currentPageSessionId;
  }

  currentPageSessionId = createUuid();
  setSessionStorageItem(SESSION_ID_KEY, currentPageSessionId);

  return currentPageSessionId;
}

export function getOrCreateAssignment(): Assignment {
  assertBrowserContext();

  const participantId = readPersistentParticipantId() ?? createUuid();
  const conditionId = readPersistentConditionId() ?? assignConditionId();

  persistAssignmentIdentity(participantId, conditionId);

  return {
    participantId,
    conditionId,
    sessionId: getOrCreateSessionId(),
  };
}
