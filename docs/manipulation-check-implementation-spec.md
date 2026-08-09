# Manipulation-Check Implementation Spec

This spec translates `docs/hsf-manipulation-checks.md` into a future implementation contract. It does not describe current runtime behavior. Use it after the research team confirms manipulation-check placement, item wording, and the approved HSF condition structure.

## Current Status

Current runtime events support:

- `task_shown`
- `decision`

Current runtime events do not yet support:

- manipulation-check screens
- manipulation-check responses
- manipulation-check CSV columns
- HSF condition metadata in manipulation-check rows

## Recommended First Implementation

For the first internal HSF pilot, use an end-of-task short-form block unless Andrya requests trial-level checks.

Recommended short-form items from `docs/hsf-manipulation-checks.md`:

| Construct | Item ID | Response target |
| --- | --- | --- |
| Agency | `agency_01` | Perceived AI agency |
| Warmth/relationality | `warmth_01` | Perceived warmth |
| Transparency | `transparency_02` | Explanation understanding |
| Capability | `capability_02` | Evidence use |
| Confidence | `confidence_01` | Confidence signal |
| Trust | `trust_01` | Self-reported trust |
| AI accountability | `blame_ai_01` | AI blame/accountability |
| Provider accountability | `blame_provider_01` | Provider blame/accountability |

Use a 1-7 Likert scale:

```text
1 = Strongly disagree
2 = Disagree
3 = Somewhat disagree
4 = Neither agree nor disagree
5 = Somewhat agree
6 = Agree
7 = Strongly agree
```

## Placement Options

| Placement | Implementation shape | Recommended use |
| --- | --- | --- |
| End-of-task block | Add one screen between main task completion and debrief/export | First internal pilot |
| Selected-trial checks | Show item subset after specific trial indexes | Later pilot if trial-level cue perception is required |
| Every-trial checks | Show one or more items after every decision | Avoid unless trial-level perception is essential |

End-of-task block is the least disruptive starting point because it does not interrupt decision timing or train participants to look for cue manipulations during the main task.

## Future Event Type

Add a separate event type rather than attaching manipulation-check answers to `decision` rows.

```ts
type EventType = "task_shown" | "decision" | "manipulation_check";
```

Candidate event shape:

```ts
interface ManipulationCheckEvent {
  event_id: string;
  participant_id: string;
  condition_id: ConditionId;
  session_id: string;
  study_run_id?: string;
  event_type: "manipulation_check";
  timestamp_ms: number;
  trial_id?: string;
  trial_index?: number;
  item_id: string;
  construct:
    | "agency"
    | "warmth"
    | "transparency"
    | "capability"
    | "confidence"
    | "trust"
    | "blame";
  response_value: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  scale_min: 1;
  scale_max: 7;
  hsf_cue_condition_id?: string;
  hsf_dimensions?: HsfDimension[];
  appearance_level?: HsfLevel;
  communication_level?: HsfLevel;
  relationality_level?: HsfLevel;
  agency_level?: HsfLevel;
  confidence_signal_level?: ConfidenceSignalLevel;
  performance_condition?: PerformanceCondition;
}
```

For end-of-task checks, `trial_id` and `trial_index` should be omitted or left undefined. For selected-trial checks, they should identify the trial that triggered the item.

## CSV Columns

If manipulation checks are implemented, add these export columns without removing current decision fields:

| Column | Applies to | Notes |
| --- | --- | --- |
| `item_id` | `manipulation_check` | Stable item ID |
| `construct` | `manipulation_check` | Agency, warmth, transparency, capability, confidence, trust, or blame |
| `response_value` | `manipulation_check` | Integer 1-7 |
| `scale_min` | `manipulation_check` | Always 1 for the proposed scale |
| `scale_max` | `manipulation_check` | Always 7 for the proposed scale |
| `hsf_cue_condition_id` | `decision`, `manipulation_check` | Add only after approved HSF conditions exist |
| `hsf_dimensions` | `decision`, `manipulation_check` | Pipe-separated in CSV if stored as an array |
| `confidence_signal_level` | `decision`, `manipulation_check` | Required if confidence becomes a factor |
| `performance_condition` | `decision`, selected-trial checks | Trial-specific; omit for end-of-task checks unless summarized condition is approved |

## Validation Rules

Future validation should reject manipulation-check events when:

- `event_type` is not `manipulation_check`.
- `item_id` is missing or not a string.
- `construct` is outside the approved construct set.
- `response_value` is not an integer from 1 to 7.
- `scale_min` is not 1 or `scale_max` is not 7.
- Trial-linked checks include a `trial_id` without a numeric `trial_index`, or the reverse.
- HSF metadata fields appear with values outside the approved enum set.

Validation should continue to accept existing `task_shown` and `decision` rows unchanged.

## UI Flow Requirements

For an end-of-task block:

1. Complete all main trials.
2. Show a manipulation-check screen before the final debrief.
3. Render one question per item with seven radio options.
4. Require a response to each item before continuing.
5. Log one `manipulation_check` event per item.
6. Show debrief/export after all item events are saved.

For selected-trial checks:

1. Complete a main-trial decision.
2. If the current trial has assigned manipulation-check items, show those items before the next trial.
3. Log one event per item with `trial_id` and `trial_index`.
4. Return to the normal staged reveal flow.

## Debug Requirements

After implementation, debug mode should show:

- whether manipulation checks are enabled
- current manipulation-check placement mode
- active item IDs
- whether a check is linked to a trial or end-of-task block
- export preview rows with `event_type=manipulation_check`

Debug controls should not expose manipulation-check constructs to participants outside `?debug=1`.

## Verification Checklist

After implementation:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Manual verification:

1. Open `http://localhost:3000/task?debug=1`.
2. Complete or jump through a session until the manipulation-check screen appears.
3. Submit the short-form item block.
4. Export JSON and CSV.
5. Confirm one `manipulation_check` row exists per submitted item.
6. Confirm each row includes participant, condition, session, timestamp, item, construct, response, and scale fields.
7. Confirm `decision` rows remain unchanged except for approved HSF metadata additions.

## Open Decisions

Before implementation, confirm:

1. Final item wording.
2. Placement mode.
3. Whether reverse-coded items are included.
4. Whether trust and blame items are part of the same block or a separate outcome block.
5. Whether selected-trial checks should be linked to all HSF dimensions or only the primary cue factor.
