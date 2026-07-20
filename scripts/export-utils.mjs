import { readFile } from "node:fs/promises";

export const EXPECTED_CSV_COLUMNS = [
  "event_id",
  "participant_id",
  "condition_id",
  "session_id",
  "event_type",
  "timestamp_ms",
  "trial_id",
  "trial_index",
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
  "study_run_id",
];

function csvEscape(value) {
  if (value === undefined || value === null) {
    return "";
  }

  const escaped = String(value).replace(/"/g, '""');
  if (/[",\n\r]/.test(escaped)) {
    return `"${escaped}"`;
  }
  return escaped;
}

export function serializeEventsToCsv(events) {
  const rows = events.map((event) => {
    return EXPECTED_CSV_COLUMNS.map((column) => {
      if (column === "cue_modules") {
        return csvEscape(event.cue_modules?.join("|"));
      }
      return csvEscape(event[column]);
    }).join(",");
  });

  return [EXPECTED_CSV_COLUMNS.join(","), ...rows].join("\n");
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        cell += '"';
        index += 1;
        continue;
      }

      if (char === '"') {
        inQuotes = false;
        continue;
      }

      cell += char;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(cell);
      cell = "";
      continue;
    }

    if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    cell += char;
  }

  if (inQuotes) {
    throw new Error("CSV has an unterminated quoted field");
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((csvRow) => {
    return csvRow.length > 1 || csvRow[0] !== "";
  });
}

function parseCsvNumber(value) {
  if (value === "") {
    return undefined;
  }

  return Number(value);
}

function parseCsvBoolean(value) {
  if (value === "") {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return value;
}

function parseOptionalCsvString(value) {
  return value === "" ? undefined : value;
}

function applyOptionalCsvField(event, field, value) {
  if (value !== undefined) {
    event[field] = value;
  }
}

function csvRecordToEvent(record) {
  const event = {
    event_id: record.event_id,
    participant_id: record.participant_id,
    condition_id: record.condition_id,
    session_id: record.session_id,
    event_type: record.event_type,
    timestamp_ms: parseCsvNumber(record.timestamp_ms),
    trial_id: record.trial_id,
    trial_index: parseCsvNumber(record.trial_index),
  };

  applyOptionalCsvField(
    event,
    "study_run_id",
    parseOptionalCsvString(record.study_run_id),
  );

  applyOptionalCsvField(event, "decision", parseOptionalCsvString(record.decision));
  applyOptionalCsvField(event, "latency_ms", parseCsvNumber(record.latency_ms));
  applyOptionalCsvField(event, "ai_reco", parseOptionalCsvString(record.ai_reco));
  applyOptionalCsvField(
    event,
    "ground_truth",
    parseOptionalCsvString(record.ground_truth),
  );
  applyOptionalCsvField(event, "follow_ai", parseCsvBoolean(record.follow_ai));
  applyOptionalCsvField(event, "ai_correct", parseCsvBoolean(record.ai_correct));
  applyOptionalCsvField(
    event,
    "cue_source",
    parseOptionalCsvString(record.cue_source),
  );

  const cueModules = parseOptionalCsvString(record.cue_modules);
  if (cueModules !== undefined) {
    event.cue_modules = cueModules.split("|").filter((item) => item.length > 0);
  }

  applyOptionalCsvField(
    event,
    "agent_name",
    parseOptionalCsvString(record.agent_name),
  );
  applyOptionalCsvField(
    event,
    "agent_tone",
    parseOptionalCsvString(record.agent_tone),
  );
  applyOptionalCsvField(
    event,
    "agent_personality",
    parseOptionalCsvString(record.agent_personality),
  );
  applyOptionalCsvField(
    event,
    "agent_avatar_label",
    parseOptionalCsvString(record.agent_avatar_label),
  );

  return event;
}

function parseCsvExport(text, sourceLabel) {
  const rows = parseCsvRows(text);

  if (rows.length === 0) {
    return [];
  }

  const [header, ...dataRows] = rows;
  const headerMatches =
    header.length === EXPECTED_CSV_COLUMNS.length &&
    header.every((column, index) => column === EXPECTED_CSV_COLUMNS[index]);

  if (!headerMatches) {
    throw new Error(
      `${sourceLabel} CSV header does not match the current export columns.`,
    );
  }

  return dataRows.map((row, rowIndex) => {
    if (row.length !== EXPECTED_CSV_COLUMNS.length) {
      throw new Error(
        `${sourceLabel} CSV row ${rowIndex + 2} has ${row.length} columns; expected ${EXPECTED_CSV_COLUMNS.length}`,
      );
    }

    const record = Object.fromEntries(
      EXPECTED_CSV_COLUMNS.map((column, index) => [column, row[index]]),
    );
    return csvRecordToEvent(record);
  });
}

export function parseExportText(text, sourceLabel) {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return {
      events: [],
      format: "empty",
    };
  }

  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) {
      throw new Error(`${sourceLabel} must contain a JSON array.`);
    }
    return {
      events: parsed,
      format: "json",
    };
  }

  if (trimmed.startsWith("{")) {
    return {
      events: trimmed.split(/\r?\n/).map((line, index) => {
        try {
          return JSON.parse(line);
        } catch (error) {
          throw new Error(
            `${sourceLabel} has invalid JSONL at line ${index + 1}: ${error.message}`,
          );
        }
      }),
      format: "jsonl",
    };
  }

  return {
    events: parseCsvExport(text, sourceLabel),
    format: "csv",
  };
}

export async function loadEvents(options) {
  if (options.url) {
    const response = await fetch(options.url);
    if (!response.ok) {
      throw new Error(
        `GET ${options.url} failed with ${response.status} ${response.statusText}`,
      );
    }

    const parsed = parseExportText(await response.text(), options.url);
    return {
      ...parsed,
      sourceLabel: options.url,
    };
  }

  if (options.file) {
    const text = await readFile(options.file, "utf8");
    return {
      ...parseExportText(text, options.file),
      sourceLabel: options.file,
    };
  }

  throw new Error("No input provided. Use --file or --url.");
}
