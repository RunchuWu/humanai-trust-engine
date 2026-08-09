# HSF Implementation Handoff

This document prepares the Week 9 implementation work without changing runtime behavior before the research format is confirmed.

Status: implementation deferred until Andrya confirms the participant-facing format, priority HSF dimensions, and approved cue condition structure.

## Decision Gates Before Code Changes

Do not start the runtime implementation until these questions are answered:

1. Will the participant-facing study remain a controlled decision-based task with fixed stimuli?
2. Which HSF dimensions are active experimental factors versus descriptive metadata?
3. Will cue conditions be independent factors, bundled high/low humanlike conditions, or the existing `control` / `industry_set` / `user_set` structure with added metadata?
4. Should manipulation checks appear after every trial, selected trials, or at the end of the task?
5. Should confidence be a cue module, a trial-level signal factor, or both?

## Current Implementation Touchpoints

| Area | Current file | Current role |
| --- | --- | --- |
| Cue config | `src/lib/cue-config.ts` | Defines cue source, cue modules, agent settings, and rationale selection |
| Trial content | `src/lib/trials.ts` | Defines scenario, evidence, recommendation, ground truth, confidence, and rationales |
| Event schema | `src/lib/schema.ts` | Validates `task_shown` and `decision` events |
| Event export | `src/lib/event-store.ts` | Defines CSV columns, filters, study-run storage, and event serialization |
| Participant flow | `src/app/task/page.tsx` | Renders staged trial flow, cue display, decisions, and event payloads |
| Debug panel | `src/app/task/components/DebugPanel.tsx` | Shows assignment, cue modules, debug toggles, data preview, and export links |
| Research docs | `docs/event-schema.md`, `docs/how-to-run.md`, `docs/operations-trial-stimuli.md` | Explain data, runtime flow, and stimuli for researcher review |

## Proposed Types After Confirmation

These names are draft implementation targets and should be adjusted to match the approved research language.

```ts
export type HsfDimension =
  | "appearance"
  | "communication"
  | "behavior"
  | "relationality"
  | "agency";

export type HsfLevel = "none" | "low" | "moderate" | "high";

export type ConfidenceSignalLevel = "modest" | "confident";

export type PerformanceCondition = "ai_correct" | "ai_incorrect";
```

Candidate additions to `ConditionConfig`:

```ts
hsfCueConditionId: string;
hsfDimensions: HsfDimension[];
appearanceLevel?: HsfLevel;
communicationLevel?: HsfLevel;
relationalityLevel?: HsfLevel;
agencyLevel?: HsfLevel;
```

Candidate additions to `Trial`:

```ts
performanceCondition: PerformanceCondition;
confidenceSignalLevel: ConfidenceSignalLevel;
behaviorSignal?: "supported" | "unsupported";
manipulationCheckItemIds?: string[];
```

Candidate additions to `DecisionEvent`:

```ts
hsf_cue_condition_id?: string;
hsf_dimensions?: HsfDimension[];
appearance_level?: HsfLevel;
communication_level?: HsfLevel;
relationality_level?: HsfLevel;
agency_level?: HsfLevel;
confidence_signal_level?: ConfidenceSignalLevel;
performance_condition?: PerformanceCondition;
```

If manipulation checks are implemented as logged events, add a new event type instead of overloading `decision`. Use `docs/manipulation-check-implementation-spec.md` for the full event, validation, CSV, UI, and debug contract.

```ts
export type EventType = "task_shown" | "decision" | "manipulation_check";
```

Candidate `ManipulationCheckEvent` fields:

```ts
item_id: string;
construct: "agency" | "warmth" | "transparency" | "capability" | "confidence" | "trust" | "blame";
response_value: number;
scale_min: 1;
scale_max: 7;
```

## Implementation Sequence

For a task-level backlog, use `docs/hsf-implementation-backlog.md`.

1. Add shared HSF types in `src/lib/cue-config.ts`, `src/lib/trials.ts`, or a new shared HSF types module if the types are used across modules.
2. Extend `ConditionConfig` with approved HSF cue metadata.
3. Extend `Trial` with approved performance and confidence-signal metadata.
4. Update event payload creation in `src/app/task/page.tsx` so decision logs include HSF metadata.
5. Update validation in `src/lib/schema.ts`.
6. Add HSF columns to `CSV_COLUMNS` and `toCsv` in `src/lib/event-store.ts`.
7. Update debug mode to display active HSF dimensions, cue condition ID, confidence-signal level, and performance condition.
8. Add manipulation-check UI only after placement is approved.
9. Update `docs/event-schema.md`, `docs/how-to-run.md`, and `docs/operations-trial-stimuli.md`.

## Debug Mode Requirements

After implementation, debug mode should show:

- participant assignment
- cue source and active cue modules
- HSF cue condition ID
- HSF dimensions represented by the active condition
- current trial performance condition
- current trial confidence-signal level
- trial AI correctness and ground truth, visible only in debug mode
- manipulation-check item IDs if checks are active

Debug mode should not change participant-facing behavior unless a researcher explicitly uses debug controls.

## Export Requirements

CSV and JSON exports should preserve existing trust-calibration fields:

- `ai_reco`
- `ground_truth`
- `follow_ai`
- `ai_correct`

Add approved HSF fields without removing old fields:

- `hsf_cue_condition_id`
- `hsf_dimensions`
- `appearance_level`
- `communication_level`
- `relationality_level`
- `agency_level`
- `confidence_signal_level`
- `performance_condition`

If manipulation checks are added, exports must include:

- `event_type=manipulation_check`
- `item_id`
- `construct`
- `response_value`
- `scale_min`
- `scale_max`
- participant, session, condition, trial, and timestamp fields from the common event envelope

## Verification Checklist

Run after Week 9 implementation:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Manual researcher checks:

1. Open `http://localhost:3000/task?debug=1`.
2. Force each approved condition.
3. Confirm the debug panel shows HSF cue metadata.
4. Complete at least one correct-AI and one incorrect-AI trial.
5. Export CSV with `event_type=decision`.
6. Confirm HSF fields and existing trust-calibration fields appear together.
7. If manipulation checks are active, submit one check response and confirm it appears in JSON/CSV export.

## Non-Goals Until Research Confirmation

- Do not replace fixed trial content with live API generation.
- Do not remove legacy `control`, `industry_set`, or `user_set` compatibility unless the research team explicitly approves a migration.
- Do not change the participant-facing decision buttons.
- Do not add high-salience visual humanlike cues before appearance-level definitions are approved.
- Do not infer final HSF dimensions from current cue modules without research-team confirmation.
