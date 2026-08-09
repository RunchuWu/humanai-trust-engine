# Condition Logic

This document describes the current condition-assignment logic and how it should relate to the Week 7-12 HSF work.

## Current Runtime Conditions

The app currently assigns participants to one of three cue-source conditions:

| `condition_id` | Cue source | Participant-facing meaning |
| --- | --- | --- |
| `control` | `control` | Plain AI/system presentation with no active humanlike cue modules |
| `industry_set` | `industry_set` | Manufacturer/system-provider configured agent presentation |
| `user_set` | `user_set` | Participant configures selected agent presentation before practice |

Source files:

- Assignment and persistence: `src/lib/conditions.ts`
- Condition rendering config: `src/lib/cue-config.ts`
- Debug forcing controls: `src/app/task/components/DebugPanel.tsx`

## Assignment Persistence

Current identity fields:

| Field | Persistence | Notes |
| --- | --- | --- |
| `participant_id` | Cookie first, fallback `localStorage` | Stable across refreshes and ordinary revisits |
| `condition_id` | Cookie first, fallback `localStorage` | Stable across refreshes and ordinary revisits |
| `session_id` | Generated per page-entry session and stored in `sessionStorage` | New debug-forced assignment creates a new session |

The current assignment strategy:

1. Read existing participant and condition values from cookies or local storage.
2. Create a new UUID participant ID if none exists.
3. Randomly assign one of `control`, `industry_set`, or `user_set` if no condition exists.
4. Persist participant and condition identity.
5. Create a page-session UUID.

## Debug Condition Forcing

Researcher debug mode at `/task?debug=1` can force:

- `control`
- `industry_set`
- `user_set`

Forcing a condition:

- keeps or creates the participant ID
- updates the persisted condition
- creates a new session ID
- allows quick review of condition-specific cue display

Debug cue-module toggles are session-local researcher controls and are not part of ordinary participant assignment.

## Current Cue Module Defaults

| Condition | Enabled cue modules |
| --- | --- |
| `control` | none |
| `industry_set` | `agent_name`, `tone_warmth`, `avatar`, `personality`, `confidence_explanation` |
| `user_set` | `agent_name`, `tone_warmth`, `avatar`, `personality`, `confidence_explanation` |

`user_set` participants can choose agent name, tone, and personality. Avatar label is derived from the selected name.

## Relationship to HSF Work

The current `condition_id` values are cue-source conditions, not final HSF experimental conditions.

Current HSF interpretation:

| Current condition | HSF interpretation |
| --- | --- |
| `control` | Low or absent humanlike presentation baseline |
| `industry_set` | Bundled provider-set humanlike cue presentation |
| `user_set` | Bundled participant-configured humanlike cue presentation |

This is useful for review, but not enough for final HSF analysis because HSF dimensions are currently inferred from cue modules rather than logged as explicit fields.

At `/task?debug=1`, the researcher panel provides a draft, read-only HSF preview
of the active cue modules and the current trial's AI correctness/confidence
visibility. The preview is implemented in `src/lib/hsf-debug.ts`; it does not
alter participant assignment, experimental conditions, event validation, or
exports.

For a condition-by-stimulus view of the current runtime behavior, see
`docs/current-condition-stimulus-matrix.md`.

## Post-Confirmation Implementation Target

After Andrya confirms the HSF condition structure, update condition logic only as needed:

1. Preserve existing `condition_id` compatibility unless migration is explicitly approved.
2. Add approved HSF metadata to condition config.
3. Add approved HSF metadata to trial config where the factor is trial-level.
4. Keep participant-facing decision buttons unchanged unless the research design changes.
5. Keep debug forcing able to review each condition.
6. Replace the draft debug preview with approved HSF cue condition ID and active
   HSF dimensions.
7. Extend exports without removing existing trust-calibration fields.

Potential future fields are listed in `docs/hsf-implementation-handoff.md`.
