# Stimulus Schema

This document describes the current runtime stimulus schema and the proposed HSF extension path. It is the Week 11 stimulus-schema reference for researchers and implementers.

## Review Bank Source

`data/stimuli/operations-stimulus-bank.json` is the structured, review-only
stimulus bank. It combines snapshots of the 10 current runtime trials with six
candidate additions. It does not replace the runtime source and does not define
approved HSF metadata.

Use `docs/stimulus-dataset-workflow.md` for the field dictionary, balance
targets, validator contract, and review process.

## Current Runtime Source of Truth

Current main-task stimuli are defined in `src/lib/trials.ts`.

Practice-trial content and screen sequencing are defined in `src/lib/experiment-config.ts`.

Cue-specific rendering is controlled by `src/lib/cue-config.ts`.

## Current Runtime Types

Current labels:

```ts
type TrialLabel = "proceed" | "reject";

type TrialType =
  | "routing_dispatch"
  | "self_driving_maneuver"
  | "target_identification"
  | "hazard_evasion";
```

Current main trial shape:

```ts
interface Trial {
  trial_id: string;
  trial_type: TrialType;
  scenario_title: string;
  situation: string;
  evidence: string[];
  action_label: string;
  opposite_action_label: string;
  ground_truth: TrialLabel;
  ai_reco: TrialLabel;
  confidence: number;
  rationale_control: string;
  rationale_warm: string;
}
```

## Current Field Semantics

| Field | Runtime role | Participant-facing? | Export/logging role |
| --- | --- | --- | --- |
| `trial_id` | Stable stimulus identifier | No | Logged in `task_shown` and `decision` events |
| `trial_type` | Operational decision family | Shown as a small trial-type hint | Useful for analysis grouping |
| `scenario_title` | Trial title | Yes | Not currently logged directly; recoverable from `trial_id` |
| `situation` | Operational prompt | Yes | Not currently logged directly; fixed in source |
| `evidence` | Sensor/context evidence list | Yes | Not currently logged directly; fixed in source |
| `action_label` | Concrete action mapped to `proceed` | Yes, through recommendation/buttons | Interprets `proceed` labels |
| `opposite_action_label` | Concrete action mapped to `reject` | Yes, through recommendation/buttons | Interprets `reject` labels |
| `ground_truth` | Correct operational outcome | No | Logged in `decision` events |
| `ai_reco` | AI recommendation | Yes | Logged in `decision` events |
| `confidence` | Numeric confidence shown only when cue config enables it | Conditional | Not logged directly today, but visible in fixed source |
| `rationale_control` | Neutral/plain rationale | Yes in control or neutral-tone rendering | Fixed source text |
| `rationale_warm` | Warm/cued rationale | Yes in warm cue rendering | Fixed source text |

## Derived Runtime Values

These values are computed from the current schema:

| Derived value | Rule | Current use |
| --- | --- | --- |
| AI correctness | `ai_reco === ground_truth` | Logged as `ai_correct` in decision events |
| Follow AI | `decision === "accept"` | Logged as `follow_ai` in decision events |
| AI recommendation label | `action_label` if `ai_reco === "proceed"`, else `opposite_action_label` | Participant-facing recommendation and decision button |
| Opposite recommendation label | Opposite of `ai_reco` | `Choose Opposite` decision button |
| Performance condition | `ai_correct ? "ai_correct" : "ai_incorrect"` | Future explicit HSF field; currently derived in analysis |

## Current Schema Limits

Current stimuli do not yet include:

- `hsf_cue_condition_id`
- `hsf_dimensions`
- `appearance_level`
- `communication_level`
- `relationality_level`
- `agency_level`
- `confidence_signal_level`
- `performance_condition`
- `manipulationCheckItemIds`

Until those fields are implemented, HSF mapping is documented outside the runtime schema and inferred from cue configuration, trial correctness, and fixed source text.

## Proposed HSF Extension

After Andrea/research-team confirmation, extend the runtime schema with approved fields such as:

```ts
type HsfDimension =
  | "appearance"
  | "communication"
  | "behavior"
  | "relationality"
  | "agency";

type HsfLevel = "none" | "low" | "moderate" | "high";
type ConfidenceSignalLevel = "modest" | "confident";
type PerformanceCondition = "ai_correct" | "ai_incorrect";

interface HsfTrialMetadata {
  hsf_cue_condition_id: string;
  hsf_dimensions: HsfDimension[];
  appearance_level?: HsfLevel;
  communication_level?: HsfLevel;
  relationality_level?: HsfLevel;
  agency_level?: HsfLevel;
  confidence_signal_level?: ConfidenceSignalLevel;
  performance_condition: PerformanceCondition;
  manipulation_check_item_ids?: string[];
}
```

Implementation should preserve existing fields so current exports and analysis remain compatible.

## Review Rules Before Schema Changes

Before adding or changing runtime stimulus fields:

1. Confirm participant-facing format.
2. Confirm active HSF dimensions.
3. Confirm condition structure.
4. Confirm confidence role.
5. Confirm manipulation-check placement.
6. Confirm whether candidate trial additions are approved.
7. Update `docs/event-schema.md` and export QA expectations if logged fields change.

## Related Documents

- `docs/operations-trial-stimuli.md`
- `docs/hsf-stimulus-design.md`
- `docs/hsf-current-trial-readiness.md`
- `docs/candidate-trial-expansion-bank.md`
- `docs/stimulus-dataset-workflow.md`
- `docs/stimulus-approval-worksheet.md`
- `docs/analysis-plan.md`
