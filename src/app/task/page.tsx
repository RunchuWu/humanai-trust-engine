"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getOrCreateAssignment, type Assignment } from "@/lib/conditions";

export default function TaskPage() {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const timer = window.setTimeout(() => {
      try {
        const nextAssignment = getOrCreateAssignment();
        if (isActive) {
          setAssignment(nextAssignment);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to create assignment.";
        if (isActive) {
          setErrorMessage(message);
        }
      }
    }, 0);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: "0 16px" }}>
      <h1>Task Assignment Check</h1>
      <p>
        This page initializes participant assignment and session IDs for validation.
      </p>

      {errorMessage ? (
        <p style={{ color: "crimson" }}>Error: {errorMessage}</p>
      ) : null}

      {assignment ? (
        <section>
          <p>
            <strong>participantId:</strong> {assignment.participantId}
          </p>
          <p>
            <strong>conditionId:</strong> {assignment.conditionId}
          </p>
          <p>
            <strong>sessionId:</strong> {assignment.sessionId}
          </p>
        </section>
      ) : (
        <p>Loading assignment...</p>
      )}

      <p>
        <Link href="/">Back to home</Link>
      </p>
    </main>
  );
}
