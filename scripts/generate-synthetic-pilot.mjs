#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { serializeEventsToCsv } from "./export-utils.mjs";

const DEFAULT_OUTPUT = "data/fixtures/synthetic-pilot.json";
const DEFAULT_CSV_OUTPUT = "data/fixtures/synthetic-pilot.csv";
const STIMULUS_BANK = "data/stimuli/operations-stimulus-bank.json";
const STUDY_RUN_ID = "synthetic-pilot-v1";
const BASE_TIMESTAMP_MS = 1_800_000_000_000;
const ALL_CUE_MODULES = [
  "agent_name",
  "tone_warmth",
  "avatar",
  "personality",
  "confidence_explanation",
];

const CONDITION_PROFILES = [
  {
    conditionId: "control",
    cueSource: "control",
    cueModules: [],
    agent: null,
  },
  {
    conditionId: "industry_set",
    cueSource: "industry_set",
    cueModules: ALL_CUE_MODULES,
    agent: {
      name: "Atlas",
      tone: "warm",
      personality: "calm",
      avatarLabel: "AT",
    },
  },
  {
    conditionId: "user_set",
    cueSource: "user_set",
    cueModules: ALL_CUE_MODULES,
    agent: {
      name: "Nova",
      tone: "warm",
      personality: "supportive",
      avatarLabel: "NV",
    },
  },
];

function parseArgs(argv) {
  const options = { csvOutput: DEFAULT_CSV_OUTPUT, output: DEFAULT_OUTPUT };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--output") {
      options.output = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--csv-output") {
      options.csvOutput = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.output) {
    throw new Error("--output requires a file path.");
  }
  if (!options.csvOutput) {
    throw new Error("--csv-output requires a file path.");
  }

  return options;
}

function formatUuid(namespace, value) {
  return `${namespace}-0000-4000-8000-${String(value).padStart(12, "0")}`;
}

function addDecisionFields(event, profile, trial, decision, latencyMs) {
  const followAi = decision === "accept";
  const result = {
    ...event,
    decision,
    latency_ms: latencyMs,
    ai_reco: trial.ai_recommendation,
    ground_truth: trial.ground_truth,
    follow_ai: followAi,
    ai_correct: trial.ai_recommendation === trial.ground_truth,
    cue_source: profile.cueSource,
    cue_modules: profile.cueModules,
  };

  if (profile.agent) {
    result.agent_name = profile.agent.name;
    result.agent_tone = profile.agent.tone;
    result.agent_personality = profile.agent.personality;
    result.agent_avatar_label = profile.agent.avatarLabel;
  }

  return result;
}

async function loadRuntimeTrials() {
  const bank = JSON.parse(await readFile(STIMULUS_BANK, "utf8"));
  const trials = bank.stimuli.filter((item) => {
    return item.source_status === "runtime_current";
  });

  if (trials.length !== 10) {
    throw new Error(
      `Expected 10 runtime_current stimuli in ${STIMULUS_BANK}; found ${trials.length}.`,
    );
  }

  return trials;
}

function generateEvents(trials) {
  const events = [];
  let eventCounter = 1;

  CONDITION_PROFILES.forEach((profile, conditionIndex) => {
    const participantId = formatUuid("10000000", conditionIndex + 1);
    const sessionId = formatUuid("11000000", conditionIndex + 1);
    const sessionStart = BASE_TIMESTAMP_MS + conditionIndex * 100_000;

    trials.forEach((trial, trialIndex) => {
      const shownAt = sessionStart + trialIndex * 3_000;
      const latencyMs = 1_200 + ((trialIndex * 137 + conditionIndex * 83) % 900);
      const decisionAt = shownAt + latencyMs;
      const decision =
        (trialIndex + conditionIndex) % 2 === 0 ? "accept" : "override";
      const baseFields = {
        participant_id: participantId,
        condition_id: profile.conditionId,
        session_id: sessionId,
        study_run_id: STUDY_RUN_ID,
        trial_id: trial.stimulus_id,
        trial_index: trialIndex,
      };

      events.push({
        event_id: formatUuid("20000000", eventCounter),
        ...baseFields,
        event_type: "task_shown",
        timestamp_ms: shownAt,
      });
      eventCounter += 1;

      events.push(
        addDecisionFields(
          {
            event_id: formatUuid("20000000", eventCounter),
            ...baseFields,
            event_type: "decision",
            timestamp_ms: decisionAt,
          },
          profile,
          trial,
          decision,
          latencyMs,
        ),
      );
      eventCounter += 1;

      // One deterministic resubmit exercises the latest-decision reduction.
      if (conditionIndex === 0 && trialIndex === 2) {
        const revisedDecision = decision === "accept" ? "override" : "accept";
        events.push(
          addDecisionFields(
            {
              event_id: formatUuid("20000000", eventCounter),
              ...baseFields,
              event_type: "decision",
              timestamp_ms: decisionAt + 400,
            },
            profile,
            trial,
            revisedDecision,
            latencyMs + 400,
          ),
        );
        eventCounter += 1;
      }
    });
  });

  return events.sort((left, right) => left.timestamp_ms - right.timestamp_ms);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(
      "Usage: node scripts/generate-synthetic-pilot.mjs [--output <path>] [--csv-output <path>]",
    );
    return;
  }

  const events = generateEvents(await loadRuntimeTrials());
  await mkdir(path.dirname(options.output), { recursive: true });
  await mkdir(path.dirname(options.csvOutput), { recursive: true });
  await writeFile(options.output, `${JSON.stringify(events, null, 2)}\n`, "utf8");
  await writeFile(
    options.csvOutput,
    `${serializeEventsToCsv(events)}\n`,
    "utf8",
  );

  console.log(`Synthetic pilot JSON written: ${options.output}`);
  console.log(`Synthetic pilot CSV written: ${options.csvOutput}`);
  console.log(`Events: ${events.length}`);
  console.log(`Study run: ${STUDY_RUN_ID}`);
  console.log("Conditions: control=1, industry_set=1, user_set=1 session");
  console.log("Intentional resubmits: 1");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
