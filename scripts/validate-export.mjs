#!/usr/bin/env node

import { loadEvents } from "./export-utils.mjs";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CONDITION_IDS = new Set([
  "control",
  "industry_set",
  "user_set",
  "A",
  "B",
]);
const EVENT_TYPES = new Set(["task_shown", "decision"]);
const DECISION_TYPES = new Set(["accept", "override"]);
const RECOMMENDATIONS = new Set(["proceed", "reject"]);
const CUE_SOURCES = new Set(["control", "industry_set", "user_set"]);
const CUE_MODULES = new Set([
  "agent_name",
  "tone_warmth",
  "avatar",
  "personality",
  "confidence_explanation",
]);
const AGENT_TONES = new Set(["neutral", "warm"]);
const AGENT_PERSONALITIES = new Set(["precise", "supportive", "calm"]);
function printUsage() {
  console.log(`Usage:
  npm run validate:export -- --file data/runs/local-dev/events.jsonl
  npm run validate:export -- --url 'http://localhost:3000/api/export?format=json'
  npm run validate:export -- --url 'http://localhost:3000/api/export?format=csv'

Options:
  --file <path>          Read a JSON array, JSONL event log, or CSV export.
  --url <url>            Fetch a JSON or CSV export from a running server.
  --allow-empty          Do not fail when no events or no decision rows exist.
  --full-session         Require at least one complete 10-decision session.
  --expect-event-type <value>
                         Require every event to match an event_type.
  --expect-condition-id <value>
                         Require every event to match a condition_id.
  --expect-cue-source <value>
                         Require every decision event to match a cue_source.
  --expect-trial-id <value>
                         Require every event to match a trial_id.
  --expect-event-count <number>
                         Require exactly this many exported events.
  --expect-decision-count <number>
                         Require exactly this many decision events.
  --help                 Show this help message.
`);
}

function parseExpectedCount(flag, value) {
  if (value === undefined) {
    throw new Error(`${flag} requires a value.`);
  }

  const count = Number(value);
  if (!Number.isInteger(count) || count < 0) {
    throw new Error(`${flag} must be a non-negative integer.`);
  }

  return count;
}

function parseArgs(argv) {
  const options = {
    allowEmpty: false,
    expectConditionId: null,
    expectDecisionCount: null,
    expectEventCount: null,
    expectCueSource: null,
    expectEventType: null,
    expectTrialId: null,
    file: null,
    fullSession: false,
    url: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--allow-empty") {
      options.allowEmpty = true;
      continue;
    }

    if (arg === "--full-session") {
      options.fullSession = true;
      continue;
    }

    if (arg === "--expect-event-count") {
      options.expectEventCount = parseExpectedCount(arg, argv[index + 1]);
      index += 1;
      continue;
    }

    if (arg === "--expect-decision-count") {
      options.expectDecisionCount = parseExpectedCount(arg, argv[index + 1]);
      index += 1;
      continue;
    }

    if (arg === "--expect-event-type") {
      options.expectEventType = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--expect-condition-id") {
      options.expectConditionId = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--expect-cue-source") {
      options.expectCueSource = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--expect-trial-id") {
      options.expectTrialId = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--file") {
      options.file = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--url") {
      options.url = argv[index + 1];
      index += 1;
      continue;
    }

    if (!arg.startsWith("--") && !options.file && !options.url) {
      if (/^https?:\/\//.test(arg)) {
        options.url = arg;
      } else {
        options.file = arg;
      }
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (options.file && options.url) {
    throw new Error("Use either --file or --url, not both.");
  }

  if (
    options.expectEventType !== null &&
    !EVENT_TYPES.has(options.expectEventType)
  ) {
    throw new Error("--expect-event-type must be task_shown or decision.");
  }

  if (
    options.expectConditionId !== null &&
    !CONDITION_IDS.has(options.expectConditionId)
  ) {
    throw new Error(
      "--expect-condition-id must be control, industry_set, user_set, or legacy A/B.",
    );
  }

  if (
    options.expectCueSource !== null &&
    !CUE_SOURCES.has(options.expectCueSource)
  ) {
    throw new Error(
      "--expect-cue-source must be control, industry_set, or user_set.",
    );
  }

  if (options.expectTrialId !== null && options.expectTrialId.length === 0) {
    throw new Error("--expect-trial-id must be a non-empty string.");
  }

  return options;
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}

function hasAllowedValue(set, value) {
  return typeof value === "string" && set.has(value);
}

function validateCueModules(value) {
  return Array.isArray(value) && value.every((item) => CUE_MODULES.has(item));
}

function validateBaseEvent(event) {
  const errors = [];

  if (!UUID_REGEX.test(event.event_id)) {
    errors.push("event_id must be a UUID string");
  }

  if (!UUID_REGEX.test(event.participant_id)) {
    errors.push("participant_id must be a UUID string");
  }

  if (!hasAllowedValue(CONDITION_IDS, event.condition_id)) {
    errors.push(
      "condition_id must be control, industry_set, user_set, or legacy A/B",
    );
  }

  if (!UUID_REGEX.test(event.session_id)) {
    errors.push("session_id must be a UUID string");
  }

  if (
    event.study_run_id !== undefined &&
    typeof event.study_run_id !== "string"
  ) {
    errors.push("study_run_id must be a string when present");
  }

  if (!hasAllowedValue(EVENT_TYPES, event.event_type)) {
    errors.push("event_type must be task_shown or decision");
  }

  if (!isFiniteNumber(event.timestamp_ms)) {
    errors.push("timestamp_ms must be a finite number");
  }

  if (!isNonEmptyString(event.trial_id)) {
    errors.push("trial_id must be a non-empty string");
  }

  if (
    !Number.isInteger(event.trial_index) ||
    event.trial_index < 0
  ) {
    errors.push("trial_index must be a non-negative integer");
  }

  return errors;
}

function validateDecisionEvent(event) {
  const errors = validateBaseEvent(event);

  if (!hasAllowedValue(DECISION_TYPES, event.decision)) {
    errors.push("decision must be accept or override");
  }

  if (!isFiniteNumber(event.latency_ms) || event.latency_ms < 0) {
    errors.push("latency_ms must be a non-negative finite number");
  }

  if (!hasAllowedValue(RECOMMENDATIONS, event.ai_reco)) {
    errors.push("ai_reco must be proceed or reject");
  }

  if (!hasAllowedValue(RECOMMENDATIONS, event.ground_truth)) {
    errors.push("ground_truth must be proceed or reject");
  }

  if (typeof event.follow_ai !== "boolean") {
    errors.push("follow_ai must be a boolean");
  }

  if (typeof event.ai_correct !== "boolean") {
    errors.push("ai_correct must be a boolean");
  }

  if (
    event.cue_source !== undefined &&
    !hasAllowedValue(CUE_SOURCES, event.cue_source)
  ) {
    errors.push("cue_source must be control, industry_set, or user_set");
  }

  if (
    event.cue_modules !== undefined &&
    !validateCueModules(event.cue_modules)
  ) {
    errors.push("cue_modules must be an array of known cue module ids");
  }

  if (event.agent_name !== undefined && typeof event.agent_name !== "string") {
    errors.push("agent_name must be a string when present");
  }

  if (
    event.agent_tone !== undefined &&
    !hasAllowedValue(AGENT_TONES, event.agent_tone)
  ) {
    errors.push("agent_tone must be neutral or warm when present");
  }

  if (
    event.agent_personality !== undefined &&
    !hasAllowedValue(AGENT_PERSONALITIES, event.agent_personality)
  ) {
    errors.push(
      "agent_personality must be precise, supportive, or calm when present",
    );
  }

  if (
    event.agent_avatar_label !== undefined &&
    typeof event.agent_avatar_label !== "string"
  ) {
    errors.push("agent_avatar_label must be a string when present");
  }

  if (
    typeof event.follow_ai === "boolean" &&
    hasAllowedValue(DECISION_TYPES, event.decision)
  ) {
    const expectedFollowAi = event.decision === "accept";
    if (event.follow_ai !== expectedFollowAi) {
      errors.push("follow_ai must match decision");
    }
  }

  if (
    typeof event.ai_correct === "boolean" &&
    hasAllowedValue(RECOMMENDATIONS, event.ai_reco) &&
    hasAllowedValue(RECOMMENDATIONS, event.ground_truth)
  ) {
    const expectedAiCorrect = event.ai_reco === event.ground_truth;
    if (event.ai_correct !== expectedAiCorrect) {
      errors.push("ai_correct must match ai_reco === ground_truth");
    }
  }

  return errors;
}

function countBy(items, keyFn) {
  const counts = new Map();
  for (const item of items) {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function formatCounts(counts) {
  if (counts.size === 0) {
    return "none";
  }

  return [...counts.entries()]
    .sort(([left], [right]) => String(left).localeCompare(String(right)))
    .map(([key, count]) => `${key}: ${count}`)
    .join(", ");
}

function analyzeEvents(events, options) {
  const errors = [];
  const warnings = [];
  const eventIds = new Set();
  const decisionKeys = new Set();
  const sessions = new Map();
  let lastTimestamp = Number.NEGATIVE_INFINITY;

  events.forEach((event, index) => {
    const label = `event[${index}]`;

    if (!isObject(event)) {
      errors.push(`${label}: event must be an object`);
      return;
    }

    const validationErrors =
      event.event_type === "decision"
        ? validateDecisionEvent(event)
        : validateBaseEvent(event);

    for (const error of validationErrors) {
      errors.push(`${label}: ${error}`);
    }

    if (
      options.expectEventType !== null &&
      event.event_type !== options.expectEventType
    ) {
      errors.push(
        `${label}: expected event_type ${options.expectEventType}, got ${event.event_type}`,
      );
    }

    if (
      options.expectConditionId !== null &&
      event.condition_id !== options.expectConditionId
    ) {
      errors.push(
        `${label}: expected condition_id ${options.expectConditionId}, got ${event.condition_id}`,
      );
    }

    if (
      options.expectTrialId !== null &&
      event.trial_id !== options.expectTrialId
    ) {
      errors.push(
        `${label}: expected trial_id ${options.expectTrialId}, got ${event.trial_id}`,
      );
    }

    if (
      options.expectCueSource !== null &&
      event.event_type === "decision" &&
      event.cue_source !== options.expectCueSource
    ) {
      errors.push(
        `${label}: expected cue_source ${options.expectCueSource}, got ${event.cue_source}`,
      );
    }

    if (eventIds.has(event.event_id)) {
      errors.push(`${label}: duplicate event_id ${event.event_id}`);
    }
    eventIds.add(event.event_id);

    if (
      isFiniteNumber(event.timestamp_ms) &&
      event.timestamp_ms < lastTimestamp
    ) {
      errors.push(`${label}: timestamp_ms is earlier than the previous event`);
    }
    if (isFiniteNumber(event.timestamp_ms)) {
      lastTimestamp = event.timestamp_ms;
    }

    const sessionKey = `${event.participant_id ?? "missing"}|${
      event.session_id ?? "missing"
    }`;
    const session = sessions.get(sessionKey) ?? {
      decisions: [],
      events: [],
      taskShown: [],
    };
    session.events.push(event);
    if (event.event_type === "decision") {
      session.decisions.push(event);
      const decisionKey = `${sessionKey}|${event.trial_id}`;
      if (decisionKeys.has(decisionKey)) {
        warnings.push(
          `${label}: duplicate decision for participant/session/trial ${decisionKey}`,
        );
      }
      decisionKeys.add(decisionKey);
    }
    if (event.event_type === "task_shown") {
      session.taskShown.push(event);
    }
    sessions.set(sessionKey, session);

    if (event.event_type === "task_shown") {
      const decisionOnlyFields = [
        "decision",
        "latency_ms",
        "ai_reco",
        "ground_truth",
        "follow_ai",
        "ai_correct",
        "cue_source",
        "cue_modules",
        "agent_name",
        "agent_tone",
        "agent_personality",
        "agent_avatar_label",
      ];
      const presentDecisionOnlyFields = decisionOnlyFields.filter(
        (field) => event[field] !== undefined,
      );
      if (presentDecisionOnlyFields.length > 0) {
        warnings.push(
          `${label}: task_shown has decision-only fields: ${presentDecisionOnlyFields.join(
            ", ",
          )}`,
        );
      }
    }
  });

  const decisionEvents = events.filter(
    (event) => isObject(event) && event.event_type === "decision",
  );

  if (!options.allowEmpty && events.length === 0) {
    errors.push("export contains no events; use --allow-empty to permit this");
  }

  if (!options.allowEmpty && decisionEvents.length === 0) {
    errors.push(
      "export contains no decision events; use --allow-empty to permit this",
    );
  }

  if (options.expectCueSource !== null && decisionEvents.length === 0) {
    errors.push("--expect-cue-source requires at least one decision event");
  }

  if (
    options.expectEventCount !== null &&
    events.length !== options.expectEventCount
  ) {
    errors.push(
      `expected ${options.expectEventCount} events, got ${events.length}`,
    );
  }

  if (
    options.expectDecisionCount !== null &&
    decisionEvents.length !== options.expectDecisionCount
  ) {
    errors.push(
      `expected ${options.expectDecisionCount} decision events, got ${decisionEvents.length}`,
    );
  }

  if (options.fullSession) {
    const completeSessions = [...sessions.values()].filter((session) => {
      const trialIndexes = new Set(
        session.decisions.map((event) => event.trial_index),
      );
      const trialIds = new Set(session.decisions.map((event) => event.trial_id));
      return (
        session.decisions.length === 10 &&
        trialIndexes.size === 10 &&
        trialIds.size === 10 &&
        [...trialIndexes].every((trialIndex) => trialIndex >= 0 && trialIndex <= 9)
      );
    });

    if (completeSessions.length === 0) {
      errors.push(
        "--full-session requires at least one participant/session with 10 unique decision rows covering trial_index 0-9",
      );
    }
  }

  return {
    decisionEvents,
    errors,
    eventTypeCounts: countBy(events, (event) => event.event_type ?? "missing"),
    conditionCounts: countBy(events, (event) => event.condition_id ?? "missing"),
    cueSourceCounts: countBy(
      decisionEvents,
      (event) => event.cue_source ?? "missing",
    ),
    decisionCounts: countBy(
      decisionEvents,
      (event) => event.decision ?? "missing",
    ),
    sessionCount: sessions.size,
    uniqueParticipantCount: new Set(
      events.filter(isObject).map((event) => event.participant_id),
    ).size,
    warnings,
  };
}

function getExpectationSummary(options) {
  const expectations = [];

  if (options.expectEventType !== null) {
    expectations.push(`event_type=${options.expectEventType}`);
  }

  if (options.expectConditionId !== null) {
    expectations.push(`condition_id=${options.expectConditionId}`);
  }

  if (options.expectCueSource !== null) {
    expectations.push(`cue_source=${options.expectCueSource}`);
  }

  if (options.expectTrialId !== null) {
    expectations.push(`trial_id=${options.expectTrialId}`);
  }

  if (options.expectEventCount !== null) {
    expectations.push(`event_count=${options.expectEventCount}`);
  }

  if (options.expectDecisionCount !== null) {
    expectations.push(`decision_count=${options.expectDecisionCount}`);
  }

  return expectations.length > 0 ? expectations.join(", ") : "none";
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  const { events, format, sourceLabel } = await loadEvents(options);
  const analysis = analyzeEvents(events, options);

  console.log(`Validated source: ${sourceLabel}`);
  console.log(`Detected format: ${format}`);
  console.log(`Events: ${events.length}`);
  console.log(`Event types: ${formatCounts(analysis.eventTypeCounts)}`);
  console.log(`Conditions: ${formatCounts(analysis.conditionCounts)}`);
  console.log(`Decision values: ${formatCounts(analysis.decisionCounts)}`);
  console.log(`Decision cue sources: ${formatCounts(analysis.cueSourceCounts)}`);
  console.log(`Expectations: ${getExpectationSummary(options)}`);
  console.log(`Participants: ${analysis.uniqueParticipantCount}`);
  console.log(`Participant/session groups: ${analysis.sessionCount}`);

  if (analysis.warnings.length > 0) {
    console.warn("\nWarnings:");
    for (const warning of analysis.warnings) {
      console.warn(`- ${warning}`);
    }
  }

  if (analysis.errors.length > 0) {
    console.error("\nValidation failed:");
    for (const error of analysis.errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("\nExport validation passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
