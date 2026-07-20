#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  getDecisionKey,
  getSessionKey,
  latestDecisionEvents,
} from "./decision-utils.mjs";
import { loadEvents } from "./export-utils.mjs";

function parseNonNegativeInteger(flag, value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${flag} must be a non-negative integer.`);
  }
  return parsed;
}

function parseArgs(argv) {
  const options = {
    expectedCompleteSessions: null,
    expectedConditions: [],
    expectedTrials: 10,
    file: null,
    highLatencyMs: 600_000,
    lowLatencyMs: 250,
    report: null,
    url: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--file" || arg === "--url" || arg === "--report") {
      const key = arg.slice(2);
      options[key] = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--expect-conditions") {
      options.expectedConditions = (argv[index + 1] ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      index += 1;
      continue;
    }

    if (arg === "--expect-complete-sessions") {
      options.expectedCompleteSessions = parseNonNegativeInteger(
        arg,
        argv[index + 1],
      );
      index += 1;
      continue;
    }

    if (arg === "--expect-trials") {
      options.expectedTrials = parseNonNegativeInteger(arg, argv[index + 1]);
      index += 1;
      continue;
    }

    if (arg === "--low-latency-ms" || arg === "--high-latency-ms") {
      const key = arg === "--low-latency-ms" ? "lowLatencyMs" : "highLatencyMs";
      options[key] = parseNonNegativeInteger(arg, argv[index + 1]);
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (options.file && options.url) {
    throw new Error("Use either --file or --url, not both.");
  }
  if (!options.file && !options.url && !options.help) {
    throw new Error("No input provided. Use --file or --url.");
  }
  if (options.lowLatencyMs > options.highLatencyMs) {
    throw new Error("--low-latency-ms must not exceed --high-latency-ms.");
  }

  return options;
}

function groupBy(items, keyFn) {
  const groups = new Map();
  for (const item of items) {
    const key = keyFn(item);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  return groups;
}

function countParticipantsByCondition(participantConditions) {
  const counts = new Map();
  for (const conditions of participantConditions.values()) {
    if (conditions.size !== 1) {
      continue;
    }
    const condition = [...conditions][0];
    counts.set(condition, (counts.get(condition) ?? 0) + 1);
  }
  return counts;
}

function formatCounts(counts) {
  if (counts.size === 0) {
    return "none";
  }
  return [...counts.entries()]
    .sort(([left], [right]) => String(left).localeCompare(String(right)))
    .map(([key, count]) => `${key}=${count}`)
    .join(", ");
}

function expectedIndexes(count) {
  return Array.from({ length: count }, (_, index) => index);
}

function analyze(events, options) {
  const blockingFailures = [];
  const reviewFlags = [];
  const decisions = events.filter((event) => event.event_type === "decision");
  const taskShown = events.filter((event) => event.event_type === "task_shown");
  const latestDecisions = latestDecisionEvents(decisions);
  const eventIdGroups = groupBy(events, (event) => event.event_id);
  const duplicateEventIds = [...eventIdGroups].filter(([, group]) => group.length > 1);
  const decisionGroups = groupBy(decisions, getDecisionKey);
  const resubmitGroups = [...decisionGroups].filter(([, group]) => group.length > 1);
  const shownGroups = groupBy(taskShown, getDecisionKey);
  const duplicateShownGroups = [...shownGroups].filter(([, group]) => group.length > 1);
  const sessionEvents = groupBy(events, getSessionKey);
  const sessionLatestDecisions = groupBy(latestDecisions, getSessionKey);
  const participantConditions = new Map();
  const sessionOwners = new Map();
  const runIds = new Set();
  let missingRunIds = 0;
  let cueSourceMismatches = 0;
  let cueMetadataMismatches = 0;

  for (const event of events) {
    const conditions = participantConditions.get(event.participant_id) ?? new Set();
    conditions.add(event.condition_id);
    participantConditions.set(event.participant_id, conditions);

    const owners = sessionOwners.get(event.session_id) ?? new Set();
    owners.add(event.participant_id);
    sessionOwners.set(event.session_id, owners);

    if (event.study_run_id) {
      runIds.add(event.study_run_id);
    } else {
      missingRunIds += 1;
    }

    if (
      event.event_type === "decision" &&
      ["control", "industry_set", "user_set"].includes(event.condition_id) &&
      event.cue_source !== event.condition_id
    ) {
      cueSourceMismatches += 1;
    }

    if (event.event_type === "decision" && event.condition_id === "control") {
      const hasAgentMetadata = [
        event.agent_name,
        event.agent_tone,
        event.agent_personality,
        event.agent_avatar_label,
      ].some((value) => value !== undefined);
      if ((event.cue_modules?.length ?? 0) !== 0 || hasAgentMetadata) {
        cueMetadataMismatches += 1;
      }
    }

    if (
      event.event_type === "decision" &&
      ["industry_set", "user_set"].includes(event.condition_id)
    ) {
      const hasCompleteAgentMetadata = [
        event.agent_name,
        event.agent_tone,
        event.agent_personality,
        event.agent_avatar_label,
      ].every((value) => typeof value === "string" && value.length > 0);
      if ((event.cue_modules?.length ?? 0) === 0 || !hasCompleteAgentMetadata) {
        cueMetadataMismatches += 1;
      }
    }
  }

  const inconsistentParticipants = [...participantConditions].filter(
    ([, conditions]) => conditions.size !== 1,
  );
  const sharedSessionIds = [...sessionOwners].filter(([, owners]) => owners.size !== 1);

  if (duplicateEventIds.length > 0) {
    blockingFailures.push(`${duplicateEventIds.length} duplicate event_id group(s)`);
  }
  if (inconsistentParticipants.length > 0) {
    blockingFailures.push(
      `${inconsistentParticipants.length} participant(s) assigned to multiple conditions`,
    );
  }
  if (sharedSessionIds.length > 0) {
    blockingFailures.push(
      `${sharedSessionIds.length} session_id value(s) shared across participants`,
    );
  }
  if (missingRunIds > 0) {
    blockingFailures.push(`${missingRunIds} event(s) missing study_run_id`);
  }
  if (cueSourceMismatches > 0) {
    blockingFailures.push(
      `${cueSourceMismatches} decision event(s) have cue_source/condition mismatch`,
    );
  }
  if (cueMetadataMismatches > 0) {
    blockingFailures.push(
      `${cueMetadataMismatches} decision event(s) have incomplete condition cue metadata`,
    );
  }

  const sessionRows = [];
  let completeSessions = 0;
  let incompleteSessions = 0;
  const requiredIndexes = expectedIndexes(options.expectedTrials);

  for (const [sessionKey, sessionGroup] of sessionEvents) {
    const sessionDecisions = sessionGroup.filter(
      (event) => event.event_type === "decision",
    );
    if (sessionDecisions.length === 0) {
      continue;
    }

    const analysisDecisions = sessionLatestDecisions.get(sessionKey) ?? [];
    const indexes = [...new Set(analysisDecisions.map((event) => event.trial_index))]
      .sort((left, right) => left - right);
    const trialIds = new Set(analysisDecisions.map((event) => event.trial_id));
    const conditions = new Set(sessionGroup.map((event) => event.condition_id));
    const isComplete =
      analysisDecisions.length === options.expectedTrials &&
      trialIds.size === options.expectedTrials &&
      indexes.length === requiredIndexes.length &&
      indexes.every((value, index) => value === requiredIndexes[index]) &&
      conditions.size === 1;

    if (isComplete) {
      completeSessions += 1;
    } else {
      incompleteSessions += 1;
    }

    sessionRows.push({
      condition: conditions.size === 1 ? [...conditions][0] : "mixed",
      isComplete,
      latestDecisionCount: analysisDecisions.length,
      rawDecisionCount: sessionDecisions.length,
      sessionKey,
      uniqueTrialCount: trialIds.size,
    });
  }

  if (incompleteSessions > 0) {
    blockingFailures.push(`${incompleteSessions} decision session(s) are incomplete`);
  }
  if (
    options.expectedCompleteSessions !== null &&
    completeSessions !== options.expectedCompleteSessions
  ) {
    blockingFailures.push(
      `expected ${options.expectedCompleteSessions} complete sessions, found ${completeSessions}`,
    );
  }

  let missingTaskShown = 0;
  for (const decision of latestDecisions) {
    const shownEvents = shownGroups.get(getDecisionKey(decision)) ?? [];
    if (!shownEvents.some((event) => event.timestamp_ms <= decision.timestamp_ms)) {
      missingTaskShown += 1;
    }
  }
  if (missingTaskShown > 0) {
    blockingFailures.push(
      `${missingTaskShown} latest decision(s) lack an earlier task_shown event`,
    );
  }

  const latestDecisionKeys = new Set(latestDecisions.map(getDecisionKey));
  const orphanTaskShown = [...shownGroups].filter(
    ([key]) => !latestDecisionKeys.has(key),
  ).length;
  if (orphanTaskShown > 0) {
    reviewFlags.push(`${orphanTaskShown} task_shown group(s) have no decision`);
  }
  if (duplicateShownGroups.length > 0) {
    reviewFlags.push(
      `${duplicateShownGroups.length} participant/session/trial group(s) have repeated task_shown events`,
    );
  }

  const participantConditionCounts = countParticipantsByCondition(
    participantConditions,
  );
  const missingExpectedConditions = options.expectedConditions.filter(
    (condition) => !participantConditionCounts.has(condition),
  );
  if (missingExpectedConditions.length > 0) {
    blockingFailures.push(
      `missing expected condition(s): ${missingExpectedConditions.join(", ")}`,
    );
  }

  const conditionCounts = [...participantConditionCounts.values()];
  if (
    conditionCounts.length > 1 &&
    Math.max(...conditionCounts) - Math.min(...conditionCounts) > 1
  ) {
    reviewFlags.push(
      `participant assignment imbalance exceeds one: ${formatCounts(
        participantConditionCounts,
      )}`,
    );
  }

  if (resubmitGroups.length > 0) {
    const extraRows = resubmitGroups.reduce(
      (total, [, group]) => total + group.length - 1,
      0,
    );
    reviewFlags.push(
      `${resubmitGroups.length} decision key(s) contain ${extraRows} resubmit row(s); latest-only reduction removes them`,
    );
  }
  if (runIds.size > 1) {
    reviewFlags.push(`input combines ${runIds.size} study_run_id values`);
  }

  const lowLatencyCount = decisions.filter(
    (event) => event.latency_ms < options.lowLatencyMs,
  ).length;
  const highLatencyCount = decisions.filter(
    (event) => event.latency_ms > options.highLatencyMs,
  ).length;
  if (lowLatencyCount > 0) {
    reviewFlags.push(
      `${lowLatencyCount} decision(s) are below ${options.lowLatencyMs}ms`,
    );
  }
  if (highLatencyCount > 0) {
    reviewFlags.push(
      `${highLatencyCount} decision(s) exceed ${options.highLatencyMs}ms`,
    );
  }

  return {
    blockingFailures,
    completeSessions,
    cueMetadataMismatches,
    cueSourceMismatches,
    decisions,
    duplicateEventIds,
    events,
    incompleteSessions,
    latestDecisions,
    missingTaskShown,
    participantConditionCounts,
    participantCount: participantConditions.size,
    resubmitGroups,
    reviewFlags,
    runIds,
    sessionRows: sessionRows.sort((left, right) =>
      left.sessionKey.localeCompare(right.sessionKey),
    ),
    taskShown,
  };
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

function buildReport(analysis, options, sourceLabel, format) {
  const status =
    analysis.blockingFailures.length > 0
      ? "FAIL"
      : analysis.reviewFlags.length > 0
        ? "PASS WITH REVIEW"
        : "PASS";
  const synthetic =
    analysis.runIds.size > 0 &&
    [...analysis.runIds].every((runId) => runId.startsWith("synthetic-"));
  const sessionRows = analysis.sessionRows.map((session) => [
    session.sessionKey.replace("|", " / "),
    session.condition,
    String(session.rawDecisionCount),
    String(session.latestDecisionCount),
    String(session.uniqueTrialCount),
    session.isComplete ? "Pass" : "Fail",
  ]);
  const conditionRows = [...analysis.participantConditionCounts]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([condition, count]) => [condition, String(count)]);
  const lines = [
    "# Pilot Data Quality Report",
    "",
    `Overall status: **${status}**`,
    "",
    `Source: \`${sourceLabel}\``,
    "",
    `Detected format: \`${format}\``,
    "",
    `Data classification: ${synthetic ? "deterministic synthetic QA fixture" : "review input; confirm provenance before analysis"}`,
    "",
    "## Summary",
    "",
    markdownTable(
      ["Metric", "Value"],
      [
        ["Events", String(analysis.events.length)],
        ["Task shown", String(analysis.taskShown.length)],
        ["Raw decisions", String(analysis.decisions.length)],
        ["Latest-only decisions", String(analysis.latestDecisions.length)],
        ["Participants", String(analysis.participantCount)],
        ["Decision sessions", String(analysis.sessionRows.length)],
        ["Complete sessions", String(analysis.completeSessions)],
        ["Incomplete sessions", String(analysis.incompleteSessions)],
        ["Study run IDs", [...analysis.runIds].join(", ") || "none"],
      ],
    ),
    "",
    "## Blocking Checks",
    "",
    analysis.blockingFailures.length === 0
      ? "All blocking integrity checks passed."
      : analysis.blockingFailures.map((item) => `- ${item}`).join("\n"),
    "",
    markdownTable(
      ["Check", "Result", "Detail"],
      [
        [
          "Unique event IDs",
          analysis.duplicateEventIds.length === 0 ? "Pass" : "Fail",
          `${analysis.duplicateEventIds.length} duplicate group(s)`,
        ],
        [
          "Complete sessions",
          analysis.incompleteSessions === 0 ? "Pass" : "Fail",
          `${analysis.completeSessions} complete; ${analysis.incompleteSessions} incomplete`,
        ],
        [
          "Task shown pairing",
          analysis.missingTaskShown === 0 ? "Pass" : "Fail",
          `${analysis.missingTaskShown} missing earlier task_shown event(s)`,
        ],
        [
          "Condition cue metadata",
          analysis.cueSourceMismatches === 0 &&
          analysis.cueMetadataMismatches === 0
            ? "Pass"
            : "Fail",
          `${analysis.cueSourceMismatches} source mismatch(es); ${analysis.cueMetadataMismatches} metadata mismatch(es)`,
        ],
        [
          "Expected conditions",
          options.expectedConditions.every((condition) =>
            analysis.participantConditionCounts.has(condition),
          )
            ? "Pass"
            : "Fail",
          options.expectedConditions.join(", ") || "not asserted",
        ],
      ],
    ),
    "",
    "## Session Completeness",
    "",
    markdownTable(
      [
        "Participant/session",
        "Condition",
        "Raw decisions",
        "Latest decisions",
        "Unique trials",
        "Result",
      ],
      sessionRows,
    ),
    "",
    "## Condition Assignment",
    "",
    markdownTable(["Condition", "Unique participants"], conditionRows),
    "",
    "## Dedupe Contract",
    "",
    `Raw decision rows: ${analysis.decisions.length}. Latest-only rows: ${analysis.latestDecisions.length}. Resubmit groups: ${analysis.resubmitGroups.length}.`,
    "",
    "The analysis key is `participant_id + session_id + trial_id`. Within each",
    "key, the row with the greatest `timestamp_ms` is retained. This is the same",
    "shared helper used by `npm run summarize:export -- --latest-only`.",
    "",
    "## Review Flags",
    "",
    analysis.reviewFlags.length === 0
      ? "No review flags."
      : analysis.reviewFlags.map((item) => `- ${item}`).join("\n"),
    "",
    "## Analysis Boundary",
    "",
    "- A passing report means the current export is structurally ready for pilot",
    "  review under the stated latest-only rule; it is not evidence that the HSF",
    "  research design or stimuli have been approved.",
    "- The current event schema does not record whether a row came from debug",
    "  mode. Debug-versus-participant separation therefore still depends on using",
    "  separate `study_run_id` values.",
    "- Condition balance is reported by unique participant. Randomized studies may",
    "  require a statistical allocation tolerance larger than this synthetic gate.",
    "",
  ];

  return lines.join("\n");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(`Usage:
  node scripts/pilot-data-qa.mjs --file <path> [options]
  node scripts/pilot-data-qa.mjs --url <url> [options]

Options:
  --report <path>
  --expect-conditions control,industry_set,user_set
  --expect-complete-sessions <number>
  --expect-trials <number>
  --low-latency-ms <number>
  --high-latency-ms <number>`);
    return;
  }

  const { events, format, sourceLabel } = await loadEvents(options);
  const analysis = analyze(events, options);
  const report = buildReport(analysis, options, sourceLabel, format);

  if (options.report) {
    await mkdir(path.dirname(options.report), { recursive: true });
    await writeFile(options.report, report, "utf8");
    console.log(`Pilot data QA report written: ${options.report}`);
  } else {
    console.log(report);
  }

  console.log(
    `Pilot data QA: ${analysis.blockingFailures.length === 0 ? "passed" : "failed"}; ${analysis.reviewFlags.length} review flag(s).`,
  );

  if (analysis.blockingFailures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
