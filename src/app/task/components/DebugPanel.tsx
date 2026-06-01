"use client";

import type { Assignment } from "@/lib/conditions";

interface DebugPanelProps {
  assignment: Assignment | null;
  currentScreen: string;
  currentTrialIndex: number;
  totalTrials: number;
  onReset: () => void;
}

export default function DebugPanel({
  assignment,
  currentScreen,
  currentTrialIndex,
  totalTrials,
  onReset,
}: DebugPanelProps) {
  return (
    <aside
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        width: 360,
        maxWidth: "calc(100vw - 24px)",
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
        <strong>Debug Panel</strong>
        <button type="button" onClick={onReset} style={{ fontSize: 12 }}>
          Reset
        </button>
      </div>

      <p style={{ margin: "4px 0" }}>
        <strong>participantId:</strong> {assignment?.participantId ?? "-"}
      </p>
      <p style={{ margin: "4px 0" }}>
        <strong>conditionId:</strong> {assignment?.conditionId ?? "-"}
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
        <p style={{ margin: "0 0 6px", fontWeight: 600 }}>Researcher Tools</p>
        <p style={{ margin: "4px 0" }}>
          <a href="/api/export?format=json" target="_blank" rel="noreferrer">
            Export JSON
          </a>
          {" | "}
          <a href="/api/export?format=csv" target="_blank" rel="noreferrer">
            Export CSV
          </a>
        </p>
      </div>
    </aside>
  );
}
