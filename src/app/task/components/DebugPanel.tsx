"use client";

import { useState } from "react";

import type { Assignment, ConditionId } from "@/lib/conditions";
import {
  CUE_MODULE_IDS,
  CUE_MODULE_LABELS,
  CONDITION_IDS,
  type CueModuleId,
  getConditionConfig,
} from "@/lib/cue-config";
import type { ExperimentScreen } from "@/lib/experiment-config";

interface DebugPanelProps {
  assignment: Assignment | null;
  currentScreen: string;
  currentTrialIndex: number;
  totalTrials: number;
  screens: ExperimentScreen[];
  effectiveCueModules: CueModuleId[];
  defaultCueModules: CueModuleId[];
  onForceCondition: (conditionId: ConditionId) => void;
  onToggleCueModule: (cueModuleId: CueModuleId) => void;
  onResetCueModules: () => void;
  onJumpToScreen: (screen: ExperimentScreen) => void;
  onReset: () => void;
}

interface RunSummary {
  study_run_id: string;
  event_count: number;
  participant_count: number;
  condition_breakdown: Record<string, number>;
  last_event_timestamp_ms: number | null;
}

interface RunsResponse {
  current_study_run_id: string;
  runs: RunSummary[];
}

interface PreviewEvent {
  event_id: string;
  participant_id: string;
  condition_id: string;
  session_id: string;
  study_run_id?: string;
  event_type: string;
  timestamp_ms: number;
  trial_id: string;
  trial_index: number;
}

interface PreviewResponse {
  current_study_run_id: string;
  total_count: number;
  returned_count: number;
  events: PreviewEvent[];
}

function formatTimestamp(timestampMs: number | null): string {
  if (timestampMs === null) {
    return "-";
  }

  return new Date(timestampMs).toLocaleString();
}

export default function DebugPanel({
  assignment,
  currentScreen,
  currentTrialIndex,
  totalTrials,
  screens,
  effectiveCueModules,
  defaultCueModules,
  onForceCondition,
  onToggleCueModule,
  onResetCueModules,
  onJumpToScreen,
  onReset,
}: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [currentStudyRunId, setCurrentStudyRunId] = useState("local-dev");
  const [studyRunFilter, setStudyRunFilter] = useState("current");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [participantFilter, setParticipantFilter] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [trialFilter, setTrialFilter] = useState("");
  const [dataError, setDataError] = useState<string | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const conditionConfig = assignment
    ? getConditionConfig(assignment.conditionId)
    : null;

  function buildDataQuery(
    format: "json" | "csv" | null,
    currentRunId = currentStudyRunId,
  ): string {
    const params = new URLSearchParams();
    const selectedRun =
      studyRunFilter === "current" ? currentRunId : studyRunFilter;

    params.set("study_run_id", selectedRun);

    if (format) {
      params.set("format", format);
    } else {
      params.set("limit", "100");
    }

    if (eventTypeFilter) {
      params.set("event_type", eventTypeFilter);
    }

    if (conditionFilter) {
      params.set("condition_id", conditionFilter);
    }

    if (participantFilter.trim()) {
      params.set("participant_id", participantFilter.trim());
    }

    if (sessionFilter.trim()) {
      params.set("session_id", sessionFilter.trim());
    }

    if (trialFilter.trim()) {
      params.set("trial_id", trialFilter.trim());
    }

    return params.toString();
  }

  async function loadPreview(currentRunId = currentStudyRunId) {
    const response = await fetch(`/api/events/preview?${buildDataQuery(null, currentRunId)}`);
    if (!response.ok) {
      throw new Error("Failed to load event preview");
    }

    const data = (await response.json()) as PreviewResponse;
    setPreview(data);
  }

  async function refreshPreview() {
    setDataError(null);
    setIsDataLoading(true);

    try {
      await loadPreview();
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setIsDataLoading(false);
    }
  }

  async function refreshResearcherData() {
    setDataError(null);
    setIsDataLoading(true);

    try {
      const response = await fetch("/api/runs");
      if (!response.ok) {
        throw new Error("Failed to load study runs");
      }

      const data = (await response.json()) as RunsResponse;
      setRuns(data.runs);
      setCurrentStudyRunId(data.current_study_run_id);
      await loadPreview(data.current_study_run_id);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setIsDataLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          void refreshResearcherData();
        }}
        style={{
          position: "fixed",
          top: 12,
          right: 12,
          border: "1px solid #cbd5e1",
          borderRadius: 8,
          background: "#fff",
          color: "#0f172a",
          padding: "8px 10px",
          fontSize: 12,
          fontWeight: 700,
          boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
          cursor: "pointer",
          zIndex: 50,
        }}
      >
        Researcher Tools
      </button>
    );
  }

  return (
    <aside
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        width: 360,
        maxWidth: "calc(100vw - 24px)",
        maxHeight: "calc(100vh - 24px)",
        overflowY: "auto",
        border: "1px solid #d1d5db",
        borderRadius: 8,
        background: "#fff",
        padding: 12,
        fontSize: 12,
        lineHeight: 1.4,
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <strong>Researcher Tools</strong>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
            }}
            style={{ fontSize: 12 }}
          >
            Collapse
          </button>
          <button type="button" onClick={onReset} style={{ fontSize: 12 }}>
            Reset
          </button>
        </div>
      </div>

      <p style={{ margin: "4px 0" }}>
        <strong>participantId:</strong> {assignment?.participantId ?? "-"}
      </p>
      <p style={{ margin: "4px 0" }}>
        <strong>conditionId:</strong> {assignment?.conditionId ?? "-"}
      </p>
      <p style={{ margin: "4px 0" }}>
        <strong>cue source:</strong> {conditionConfig?.cueSource ?? "-"}
      </p>
      <p style={{ margin: "4px 0" }}>
        <strong>cue modules:</strong>{" "}
        {effectiveCueModules.length > 0 ? effectiveCueModules.join(", ") : "none"}
      </p>
      <p style={{ margin: "4px 0" }}>
        <strong>sessionId:</strong> {assignment?.sessionId ?? "-"}
      </p>
      <p style={{ margin: "4px 0" }}>
        <strong>current screen:</strong> {currentScreen}
      </p>
      <p style={{ margin: "4px 0" }}>
        <strong>current trial_index:</strong> {currentTrialIndex}
      </p>
      <p style={{ margin: "4px 0" }}>
        <strong>progress:</strong> {Math.min(currentTrialIndex + 1, totalTrials)}/
        {totalTrials}
      </p>

      <div
        style={{
          marginTop: 10,
          paddingTop: 10,
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <p style={{ margin: "0 0 6px", fontWeight: 600 }}>Jump to screen</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 6,
            marginBottom: 10,
          }}
        >
          {screens.map((screen) => (
            <button
              key={screen}
              type="button"
              onClick={() => {
                onJumpToScreen(screen);
              }}
              style={{
                fontSize: 11,
                fontWeight: currentScreen === screen ? 700 : 400,
              }}
            >
              {screen}
            </button>
          ))}
        </div>
        <p style={{ margin: "0 0 6px", fontWeight: 600 }}>Assignment</p>
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 8,
          }}
        >
          {CONDITION_IDS.map((conditionId) => (
            <button
              key={conditionId}
              type="button"
              onClick={() => {
                onForceCondition(conditionId);
              }}
              style={{
                fontSize: 12,
                fontWeight: assignment?.conditionId === conditionId ? 700 : 400,
              }}
            >
              Force {conditionId}
            </button>
          ))}
        </div>
        <p style={{ margin: "0 0 6px", fontWeight: 600 }}>HumanQ Toggles</p>
        <p style={{ margin: "0 0 6px", color: "#64748b" }}>
          Defaults: {defaultCueModules.length > 0 ? defaultCueModules.join(", ") : "none"}
        </p>
        <div
          style={{
            display: "grid",
            gap: 6,
            marginBottom: 8,
          }}
        >
          {CUE_MODULE_IDS.map((cueModuleId) => (
            <label
              key={cueModuleId}
              style={{
                display: "flex",
                gap: 6,
                alignItems: "flex-start",
              }}
            >
              <input
                type="checkbox"
                checked={effectiveCueModules.includes(cueModuleId)}
                onChange={() => {
                  onToggleCueModule(cueModuleId);
                }}
              />
              <span>{CUE_MODULE_LABELS[cueModuleId]}</span>
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={onResetCueModules}
          style={{ fontSize: 12, marginBottom: 8 }}
        >
          Reset toggles
        </button>
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <p style={{ margin: "0 0 6px", fontWeight: 600 }}>Data Preview</p>
          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ display: "grid", gap: 2 }}>
              <span>Study run</span>
              <select
                value={studyRunFilter}
                onChange={(event) => {
                  setStudyRunFilter(event.target.value);
                }}
              >
                <option value="current">Current ({currentStudyRunId})</option>
                <option value="all">All runs</option>
                {runs.map((run) => (
                  <option key={run.study_run_id} value={run.study_run_id}>
                    {run.study_run_id}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "grid", gap: 2 }}>
              <span>Event type</span>
              <select
                value={eventTypeFilter}
                onChange={(event) => {
                  setEventTypeFilter(event.target.value);
                }}
              >
                <option value="">All events</option>
                <option value="task_shown">task_shown</option>
                <option value="decision">decision</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: 2 }}>
              <span>Condition</span>
              <select
                value={conditionFilter}
                onChange={(event) => {
                  setConditionFilter(event.target.value);
                }}
              >
                <option value="">All conditions</option>
                {CONDITION_IDS.map((conditionId) => (
                  <option key={conditionId} value={conditionId}>
                    {conditionId}
                  </option>
                ))}
              </select>
            </label>
            <input
              type="text"
              placeholder="participant_id"
              value={participantFilter}
              onChange={(event) => {
                setParticipantFilter(event.target.value);
              }}
            />
            <input
              type="text"
              placeholder="session_id"
              value={sessionFilter}
              onChange={(event) => {
                setSessionFilter(event.target.value);
              }}
            />
            <input
              type="text"
              placeholder="trial_id"
              value={trialFilter}
              onChange={(event) => {
                setTrialFilter(event.target.value);
              }}
            />
            <button
              type="button"
              onClick={() => {
                void refreshPreview();
              }}
              disabled={isDataLoading}
              style={{ fontSize: 12 }}
            >
              {isDataLoading ? "Loading..." : "Apply filters"}
            </button>
          </div>

          {dataError ? (
            <p style={{ margin: "6px 0", color: "#b91c1c" }}>{dataError}</p>
          ) : null}

          <div style={{ marginTop: 8 }}>
            <p style={{ margin: "0 0 4px", fontWeight: 600 }}>Runs</p>
            {runs.length === 0 ? (
              <p style={{ margin: "0 0 6px", color: "#64748b" }}>
                No study-run files found yet.
              </p>
            ) : null}
            {runs.map((run) => (
              <div
                key={run.study_run_id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  padding: 6,
                  marginBottom: 6,
                }}
              >
                <strong>{run.study_run_id}</strong>
                <p style={{ margin: "2px 0" }}>
                  events: {run.event_count}; participants:{" "}
                  {run.participant_count}
                </p>
                <p style={{ margin: "2px 0" }}>
                  last: {formatTimestamp(run.last_event_timestamp_ms)}
                </p>
                <p style={{ margin: "2px 0", color: "#64748b" }}>
                  conditions:{" "}
                  {Object.keys(run.condition_breakdown).length > 0
                    ? Object.entries(run.condition_breakdown)
                        .map(([conditionId, count]) => `${conditionId}:${count}`)
                        .join(", ")
                    : "none"}
                </p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 8 }}>
            <p style={{ margin: "0 0 4px", fontWeight: 600 }}>
              Preview{" "}
              {preview
                ? `(${preview.returned_count}/${preview.total_count})`
                : ""}
            </p>
            {preview?.events.slice(0, 8).map((event) => (
              <div
                key={event.event_id}
                style={{
                  borderTop: "1px solid #f1f5f9",
                  padding: "5px 0",
                }}
              >
                <strong>{event.event_type}</strong> {event.trial_id} #
                {event.trial_index}
                <br />
                <span style={{ color: "#64748b" }}>
                  {event.study_run_id ?? "-"} / {event.condition_id} /{" "}
                  {formatTimestamp(event.timestamp_ms)}
                </span>
              </div>
            ))}
            {preview && preview.events.length === 0 ? (
              <p style={{ margin: "0 0 6px", color: "#64748b" }}>
                No events match the active filters.
              </p>
            ) : null}
          </div>

          <p style={{ margin: "8px 0 0" }}>
            <a
              href={`/api/export?${buildDataQuery("json")}`}
              target="_blank"
              rel="noreferrer"
            >
              Export filtered JSON
            </a>
            {" | "}
            <a
              href={`/api/export?${buildDataQuery("csv")}`}
              target="_blank"
              rel="noreferrer"
            >
              Export filtered CSV
            </a>
          </p>
        </div>
      </div>
    </aside>
  );
}
