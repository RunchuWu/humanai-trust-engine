"use client";

import { useState } from "react";

import type { Assignment, ConditionId } from "@/lib/conditions";
import type { ExperimentScreen } from "@/lib/experiment-config";

interface DebugPanelProps {
  assignment: Assignment | null;
  currentScreen: string;
  currentTrialIndex: number;
  totalTrials: number;
  screens: ExperimentScreen[];
  onForceCondition: (conditionId: ConditionId) => void;
  onJumpToScreen: (screen: ExperimentScreen) => void;
  onReset: () => void;
}

export default function DebugPanel({
  assignment,
  currentScreen,
  currentTrialIndex,
  totalTrials,
  screens,
  onForceCondition,
  onJumpToScreen,
  onReset,
}: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
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
          <button
            type="button"
            onClick={() => {
              onForceCondition("A");
            }}
            style={{ fontSize: 12 }}
          >
            Force A
          </button>
          <button
            type="button"
            onClick={() => {
              onForceCondition("B");
            }}
            style={{ fontSize: 12 }}
          >
            Force B
          </button>
        </div>
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
