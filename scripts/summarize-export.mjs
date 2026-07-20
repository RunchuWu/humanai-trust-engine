#!/usr/bin/env node

import { loadEvents } from "./export-utils.mjs";
import { latestDecisionEvents } from "./decision-utils.mjs";

function printUsage() {
  console.log(`Usage:
  npm run summarize:export -- --file data/runs/local-dev/events.jsonl
  npm run summarize:export -- --url 'http://localhost:3000/api/export?format=json'
  npm run summarize:export -- --url 'http://localhost:3000/api/export?format=csv'

Options:
  --file <path>          Read a JSON array, JSONL event log, or CSV export.
  --url <url>            Fetch a JSON or CSV export from a running server.
  --latest-only          Keep only the latest decision per participant/session/trial.
  --help                 Show this help message.
`);
}

function parseArgs(argv) {
  const options = {
    file: null,
    latestOnly: false,
    url: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--latest-only") {
      options.latestOnly = true;
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

  return options;
}

function isDecisionEvent(event) {
  return event && event.event_type === "decision";
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

function median(values) {
  const sorted = values
    .filter((value) => typeof value === "number" && Number.isFinite(value))
    .sort((a, b) => a - b);

  if (sorted.length === 0) {
    return null;
  }

  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }

  return (sorted[middle - 1] + sorted[middle]) / 2;
}

function rate(numerator, denominator) {
  if (denominator === 0) {
    return "n/a";
  }

  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function summarizeDecisions(decisions) {
  const total = decisions.length;
  const followAi = decisions.filter((event) => event.follow_ai === true).length;
  const overrideAi = decisions.filter((event) => event.follow_ai === false).length;
  const aiCorrect = decisions.filter((event) => event.ai_correct === true).length;
  const aiIncorrect = decisions.filter(
    (event) => event.ai_correct === false,
  ).length;
  const calibrated = decisions.filter((event) => {
    return event.follow_ai === event.ai_correct;
  }).length;
  const correctFollow = decisions.filter((event) => {
    return event.follow_ai === true && event.ai_correct === true;
  }).length;
  const correctOverride = decisions.filter((event) => {
    return event.follow_ai === false && event.ai_correct === false;
  }).length;
  const overtrust = decisions.filter((event) => {
    return event.follow_ai === true && event.ai_correct === false;
  }).length;
  const undertrust = decisions.filter((event) => {
    return event.follow_ai === false && event.ai_correct === true;
  }).length;

  return {
    aiCorrect,
    aiIncorrect,
    calibrated,
    correctFollow,
    correctOverride,
    followAi,
    latencyMedianMs: median(decisions.map((event) => event.latency_ms)),
    overtrust,
    overrideAi,
    total,
    undertrust,
  };
}

function formatMedian(value) {
  if (value === null) {
    return "n/a";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function summaryRow(label, decisions) {
  const summary = summarizeDecisions(decisions);

  return [
    label,
    String(summary.total),
    `${summary.followAi} (${rate(summary.followAi, summary.total)})`,
    `${summary.calibrated} (${rate(summary.calibrated, summary.total)})`,
    `${summary.overtrust} (${rate(summary.overtrust, summary.total)})`,
    `${summary.undertrust} (${rate(summary.undertrust, summary.total)})`,
    `${summary.correctFollow} (${rate(summary.correctFollow, summary.total)})`,
    `${summary.correctOverride} (${rate(summary.correctOverride, summary.total)})`,
    formatMedian(summary.latencyMedianMs),
  ];
}

function printMarkdownTable(headers, rows) {
  console.log(`| ${headers.join(" | ")} |`);
  console.log(`| ${headers.map(() => "---").join(" | ")} |`);

  for (const row of rows) {
    console.log(`| ${row.join(" | ")} |`);
  }
}

function printSummary(events, options, sourceLabel, format) {
  const allDecisions = events.filter(isDecisionEvent);
  const decisions = options.latestOnly
    ? latestDecisionEvents(allDecisions)
    : allDecisions;

  console.log(`# Export Summary`);
  console.log("");
  console.log(`Source: ${sourceLabel}`);
  console.log(`Detected format: ${format}`);
  console.log(`Events: ${events.length}`);
  console.log(`Decision events analyzed: ${decisions.length}`);

  if (options.latestOnly) {
    console.log(
      `Decision reduction: latest decision per participant/session/trial`,
    );
  } else {
    console.log(`Decision reduction: all decision events`);
  }

  console.log(
    `Participants: ${new Set(decisions.map((event) => event.participant_id)).size}`,
  );
  console.log(
    `Participant/session groups: ${
      new Set(
        decisions.map((event) => `${event.participant_id}|${event.session_id}`),
      ).size
    }`,
  );
  console.log("");

  const headers = [
    "Group",
    "Decisions",
    "Follow AI",
    "Calibrated",
    "Overtrust",
    "Undertrust",
    "Correct follow",
    "Correct override",
    "Median latency ms",
  ];

  console.log("## Overall");
  console.log("");
  printMarkdownTable(headers, [summaryRow("All decisions", decisions)]);
  console.log("");

  console.log("## By Condition");
  console.log("");
  const conditionRows = [...groupBy(decisions, (event) => event.condition_id)]
    .sort(([left], [right]) => String(left).localeCompare(String(right)))
    .map(([conditionId, conditionDecisions]) => {
      return summaryRow(conditionId, conditionDecisions);
    });
  printMarkdownTable(headers, conditionRows);
  console.log("");

  console.log("## By Condition And AI Correctness");
  console.log("");
  const conditionCorrectRows = [
    ...groupBy(decisions, (event) => {
      const performance = event.ai_correct ? "ai_correct" : "ai_incorrect";
      return `${event.condition_id} / ${performance}`;
    }),
  ]
    .sort(([left], [right]) => String(left).localeCompare(String(right)))
    .map(([label, groupDecisions]) => summaryRow(label, groupDecisions));
  printMarkdownTable(headers, conditionCorrectRows);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  const { events, format, sourceLabel } = await loadEvents(options);
  printSummary(events, options, sourceLabel, format);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
