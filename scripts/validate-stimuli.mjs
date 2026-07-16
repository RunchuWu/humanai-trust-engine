#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";

import ts from "typescript";

const DEFAULT_DATASET_PATH = "data/stimuli/operations-stimulus-bank.json";
const RUNTIME_TRIALS_PATH = "src/lib/trials.ts";
const TRIAL_TYPES = new Set([
  "routing_dispatch",
  "self_driving_maneuver",
  "target_identification",
  "hazard_evasion",
]);
const OUTCOMES = new Set(["proceed", "reject"]);
const SOURCE_STATUSES = new Set(["runtime_current", "candidate"]);
const REVIEW_STATUSES = new Set([
  "pending",
  "approved",
  "revise",
  "rejected",
]);
const EXPECTED_BALANCE = {
  total: 16,
  source_status: { runtime_current: 10, candidate: 6 },
  trial_type: {
    routing_dispatch: 4,
    self_driving_maneuver: 4,
    target_identification: 4,
    hazard_evasion: 4,
  },
  ground_truth: { proceed: 8, reject: 8 },
  ai_recommendation: { proceed: 8, reject: 8 },
  ai_correctness: { correct: 8, incorrect: 8 },
  error_type: { false_proceed: 4, false_reject: 4 },
};
const RATIONALE_WORD_DELTA_WARNING = 6;

function printUsage() {
  console.log(`Usage:
  npm run validate:stimuli
  npm run validate:stimuli -- --json
  npm run validate:stimuli -- --strict-reading-load
  npm run validate:stimuli -- --file <path>

Options:
  --file <path>          Validate another stimulus-bank JSON file.
  --json                 Print the quality report as JSON.
  --strict-reading-load  Treat rationale word-count warnings as errors.
  --help                 Show this help message.
`);
}

function parseArgs(argv) {
  const options = {
    file: DEFAULT_DATASET_PATH,
    json: false,
    strictReadingLoad: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--json") {
      options.json = true;
      continue;
    }

    if (arg === "--strict-reading-load") {
      options.strictReadingLoad = true;
      continue;
    }

    if (arg === "--file") {
      if (!argv[index + 1]) {
        throw new Error("--file requires a path.");
      }
      options.file = argv[index + 1];
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function wordCount(value) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function countBy(items, selectKey) {
  const counts = {};
  for (const item of items) {
    const key = selectKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function median(values) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[midpoint];
  }

  return (sorted[midpoint - 1] + sorted[midpoint]) / 2;
}

function getCorrectness(stimulus) {
  return stimulus.ai_recommendation === stimulus.ground_truth
    ? "correct"
    : "incorrect";
}

function getErrorType(stimulus) {
  if (getCorrectness(stimulus) === "correct") {
    return "correct";
  }

  return stimulus.ai_recommendation === "proceed"
    ? "false_proceed"
    : "false_reject";
}

function loadRuntimeTrials(rootDir) {
  const sourcePath = path.join(rootDir, RUNTIME_TRIALS_PATH);
  const source = fs.readFileSync(sourcePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourcePath,
  }).outputText;
  const commonJsModule = { exports: {} };

  vm.runInNewContext(compiled, {
    exports: commonJsModule.exports,
    module: commonJsModule,
  });

  if (!Array.isArray(commonJsModule.exports.TRIALS)) {
    throw new Error(`${RUNTIME_TRIALS_PATH} did not export a TRIALS array.`);
  }

  return commonJsModule.exports.TRIALS;
}

function normalizeRuntimeTrial(trial) {
  return {
    stimulus_id: trial.trial_id,
    trial_type: trial.trial_type,
    scenario_title: trial.scenario_title,
    situation: trial.situation,
    evidence: trial.evidence,
    action_label: trial.action_label,
    opposite_action_label: trial.opposite_action_label,
    ground_truth: trial.ground_truth,
    ai_recommendation: trial.ai_reco,
    confidence_percent: trial.confidence,
    rationales: {
      neutral: trial.rationale_control,
      warm: trial.rationale_warm,
    },
  };
}

function normalizeBankStimulus(stimulus) {
  return {
    stimulus_id: stimulus.stimulus_id,
    trial_type: stimulus.trial_type,
    scenario_title: stimulus.scenario_title,
    situation: stimulus.situation,
    evidence: stimulus.evidence,
    action_label: stimulus.action_label,
    opposite_action_label: stimulus.opposite_action_label,
    ground_truth: stimulus.ground_truth,
    ai_recommendation: stimulus.ai_recommendation,
    confidence_percent: stimulus.confidence_percent,
    rationales: stimulus.rationales,
  };
}

function validateStimulus(stimulus, index) {
  const errors = [];
  const prefix = `stimuli[${index}]`;

  if (!isObject(stimulus)) {
    return [`${prefix} must be an object`];
  }

  for (const field of [
    "stimulus_id",
    "source_status",
    "trial_type",
    "scenario_title",
    "situation",
    "action_label",
    "opposite_action_label",
    "ground_truth",
    "ai_recommendation",
  ]) {
    if (!isNonEmptyString(stimulus[field])) {
      errors.push(`${prefix}.${field} must be a non-empty string`);
    }
  }

  if (!SOURCE_STATUSES.has(stimulus.source_status)) {
    errors.push(`${prefix}.source_status must be runtime_current or candidate`);
  }

  if (!TRIAL_TYPES.has(stimulus.trial_type)) {
    errors.push(`${prefix}.trial_type is not supported`);
  }

  if (!OUTCOMES.has(stimulus.ground_truth)) {
    errors.push(`${prefix}.ground_truth must be proceed or reject`);
  }

  if (!OUTCOMES.has(stimulus.ai_recommendation)) {
    errors.push(`${prefix}.ai_recommendation must be proceed or reject`);
  }

  if (
    !Number.isInteger(stimulus.confidence_percent) ||
    stimulus.confidence_percent < 0 ||
    stimulus.confidence_percent > 100
  ) {
    errors.push(`${prefix}.confidence_percent must be an integer from 0 to 100`);
  }

  if (
    !Array.isArray(stimulus.evidence) ||
    stimulus.evidence.length !== 3 ||
    !stimulus.evidence.every(isNonEmptyString)
  ) {
    errors.push(`${prefix}.evidence must contain exactly three non-empty strings`);
  }

  if (stimulus.action_label === stimulus.opposite_action_label) {
    errors.push(`${prefix} action labels must be distinct`);
  }

  if (!isObject(stimulus.rationales)) {
    errors.push(`${prefix}.rationales must be an object`);
  } else {
    if (!isNonEmptyString(stimulus.rationales.neutral)) {
      errors.push(`${prefix}.rationales.neutral must be a non-empty string`);
    }
    if (!isNonEmptyString(stimulus.rationales.warm)) {
      errors.push(`${prefix}.rationales.warm must be a non-empty string`);
    }
  }

  if (!isObject(stimulus.review)) {
    errors.push(`${prefix}.review must be an object`);
  } else {
    if (!REVIEW_STATUSES.has(stimulus.review.status)) {
      errors.push(`${prefix}.review.status is not supported`);
    }
    if (
      !Array.isArray(stimulus.review.notes) ||
      !stimulus.review.notes.every(isNonEmptyString)
    ) {
      errors.push(`${prefix}.review.notes must be an array of non-empty strings`);
    }
  }

  return errors;
}

function validateExpectedCounts(errors, label, actual, expected) {
  for (const [key, expectedCount] of Object.entries(expected)) {
    const actualCount = actual[key] ?? 0;
    if (actualCount !== expectedCount) {
      errors.push(
        `${label}.${key} expected ${expectedCount}, received ${actualCount}`,
      );
    }
  }
}

function buildReport(dataset, runtimeTrials) {
  const errors = [];
  const warnings = [];

  if (!isObject(dataset)) {
    return { errors: ["dataset must be an object"], warnings };
  }

  if (dataset.schema_version !== 1) {
    errors.push("schema_version must be 1");
  }
  if (!isNonEmptyString(dataset.dataset_id)) {
    errors.push("dataset_id must be a non-empty string");
  }
  if (dataset.dataset_status !== "review_only") {
    errors.push("dataset_status must be review_only");
  }
  if (dataset.runtime_integration !== "not_active") {
    errors.push("runtime_integration must be not_active before research approval");
  }
  if (!Array.isArray(dataset.stimuli)) {
    return { errors: [...errors, "stimuli must be an array"], warnings };
  }

  const stimuli = dataset.stimuli;
  stimuli.forEach((stimulus, index) => {
    errors.push(...validateStimulus(stimulus, index));
  });

  const ids = stimuli.map((stimulus) => stimulus.stimulus_id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  for (const duplicateId of new Set(duplicateIds)) {
    errors.push(`duplicate stimulus_id: ${duplicateId}`);
  }

  if (stimuli.length !== EXPECTED_BALANCE.total) {
    errors.push(
      `stimuli expected ${EXPECTED_BALANCE.total} records, received ${stimuli.length}`,
    );
  }

  const sourceStatus = countBy(stimuli, (item) => item.source_status);
  const trialType = countBy(stimuli, (item) => item.trial_type);
  const groundTruth = countBy(stimuli, (item) => item.ground_truth);
  const aiRecommendation = countBy(
    stimuli,
    (item) => item.ai_recommendation,
  );
  const aiCorrectness = countBy(stimuli, getCorrectness);
  const errorTypeAll = countBy(stimuli, getErrorType);
  const errorType = {
    false_proceed: errorTypeAll.false_proceed ?? 0,
    false_reject: errorTypeAll.false_reject ?? 0,
  };

  validateExpectedCounts(
    errors,
    "source_status",
    sourceStatus,
    EXPECTED_BALANCE.source_status,
  );
  validateExpectedCounts(
    errors,
    "trial_type",
    trialType,
    EXPECTED_BALANCE.trial_type,
  );
  validateExpectedCounts(
    errors,
    "ground_truth",
    groundTruth,
    EXPECTED_BALANCE.ground_truth,
  );
  validateExpectedCounts(
    errors,
    "ai_recommendation",
    aiRecommendation,
    EXPECTED_BALANCE.ai_recommendation,
  );
  validateExpectedCounts(
    errors,
    "ai_correctness",
    aiCorrectness,
    EXPECTED_BALANCE.ai_correctness,
  );
  validateExpectedCounts(
    errors,
    "error_type",
    errorType,
    EXPECTED_BALANCE.error_type,
  );

  const runtimeBankStimuli = stimuli.filter(
    (stimulus) => stimulus.source_status === "runtime_current",
  );
  const bankById = new Map(
    runtimeBankStimuli.map((stimulus) => [stimulus.stimulus_id, stimulus]),
  );

  for (const runtimeTrial of runtimeTrials) {
    const bankStimulus = bankById.get(runtimeTrial.trial_id);
    if (!bankStimulus) {
      errors.push(`runtime trial missing from bank: ${runtimeTrial.trial_id}`);
      continue;
    }

    const runtimeNormalized = normalizeRuntimeTrial(runtimeTrial);
    const bankNormalized = normalizeBankStimulus(bankStimulus);
    if (JSON.stringify(runtimeNormalized) !== JSON.stringify(bankNormalized)) {
      errors.push(`runtime stimulus drift detected: ${runtimeTrial.trial_id}`);
    }
  }

  const runtimeIds = new Set(runtimeTrials.map((trial) => trial.trial_id));
  for (const stimulus of runtimeBankStimuli) {
    if (!runtimeIds.has(stimulus.stimulus_id)) {
      errors.push(
        `bank marks non-runtime stimulus as runtime_current: ${stimulus.stimulus_id}`,
      );
    }
  }

  const rationaleLoads = stimuli.map((stimulus) => {
    const neutralWords = wordCount(stimulus.rationales.neutral);
    const warmWords = wordCount(stimulus.rationales.warm);
    const delta = warmWords - neutralWords;

    if (Math.abs(delta) > RATIONALE_WORD_DELTA_WARNING) {
      warnings.push(
        `${stimulus.stimulus_id} rationale word delta is ${delta} ` +
          `(neutral ${neutralWords}, warm ${warmWords})`,
      );
    }

    return {
      stimulus_id: stimulus.stimulus_id,
      neutral_words: neutralWords,
      warm_words: warmWords,
      delta_words: delta,
    };
  });

  const confidences = stimuli.map((stimulus) => stimulus.confidence_percent);
  const reviewStatus = countBy(stimuli, (item) => item.review.status);

  return {
    dataset_id: dataset.dataset_id,
    dataset_status: dataset.dataset_status,
    runtime_integration: dataset.runtime_integration,
    counts: {
      total: stimuli.length,
      source_status: sourceStatus,
      trial_type: trialType,
      ground_truth: groundTruth,
      ai_recommendation: aiRecommendation,
      ai_correctness: aiCorrectness,
      error_type: errorType,
      review_status: reviewStatus,
    },
    confidence_percent: {
      min: confidences.length > 0 ? Math.min(...confidences) : null,
      median: median(confidences),
      max: confidences.length > 0 ? Math.max(...confidences) : null,
    },
    runtime_sync: {
      runtime_trial_count: runtimeTrials.length,
      matched_bank_count: runtimeBankStimuli.length,
    },
    rationale_load: rationaleLoads,
    warnings,
    errors,
  };
}

function formatCounts(counts) {
  return Object.entries(counts)
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");
}

function printTextReport(report) {
  console.log(`Dataset: ${report.dataset_id}`);
  console.log(`Status: ${report.dataset_status}; runtime=${report.runtime_integration}`);
  console.log(`Stimuli: ${report.counts.total}`);
  console.log(`Source status: ${formatCounts(report.counts.source_status)}`);
  console.log(`Trial types: ${formatCounts(report.counts.trial_type)}`);
  console.log(`Ground truth: ${formatCounts(report.counts.ground_truth)}`);
  console.log(
    `AI recommendations: ${formatCounts(report.counts.ai_recommendation)}`,
  );
  console.log(`AI correctness: ${formatCounts(report.counts.ai_correctness)}`);
  console.log(`Error types: ${formatCounts(report.counts.error_type)}`);
  console.log(`Review status: ${formatCounts(report.counts.review_status)}`);
  console.log(
    `Confidence: min=${report.confidence_percent.min}, ` +
      `median=${report.confidence_percent.median}, ` +
      `max=${report.confidence_percent.max}`,
  );
  console.log(
    `Runtime sync: ${report.runtime_sync.matched_bank_count}/` +
      `${report.runtime_sync.runtime_trial_count}`,
  );

  if (report.warnings.length > 0) {
    console.log("\nReading-load warnings:");
    for (const warning of report.warnings) {
      console.log(`- ${warning}`);
    }
  }

  if (report.errors.length > 0) {
    console.error("\nValidation errors:");
    for (const error of report.errors) {
      console.error(`- ${error}`);
    }
    return;
  }

  console.log("\nStimulus dataset validation passed.");
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }

  if (options.help) {
    printUsage();
    return;
  }

  const rootDir = process.cwd();
  const datasetPath = path.resolve(rootDir, options.file);
  let dataset;
  let runtimeTrials;

  try {
    dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8"));
    runtimeTrials = loadRuntimeTrials(rootDir);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }

  const report = buildReport(dataset, runtimeTrials);
  if (options.strictReadingLoad && report.warnings.length > 0) {
    report.errors.push(
      `${report.warnings.length} reading-load warning(s) found in strict mode`,
    );
  }

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printTextReport(report);
  }

  if (report.errors.length > 0) {
    process.exitCode = 1;
  }
}

main();
