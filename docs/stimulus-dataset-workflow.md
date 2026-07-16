# Stimulus Dataset Workflow

This workflow defines the direction-independent stimulus dataset that can be
reviewed while the final participant format and HSF condition structure remain
open.

## Current Dataset

Canonical review bank:

- `data/stimuli/operations-stimulus-bank.json`

Validation command:

```bash
npm run validate:stimuli
```

Machine-readable quality report:

```bash
npm run validate:stimuli -- --json
```

The bank contains:

- 10 `runtime_current` stimuli mirrored from `src/lib/trials.ts`
- 6 `candidate` stimuli from `docs/candidate-trial-expansion-bank.md`
- 16 `pending` review records in total

The dataset is `review_only`, and `runtime_integration` is `not_active`. The app
still reads its 10 participant-facing trials from `src/lib/trials.ts`.

## Why JSON Is Canonical

JSON keeps evidence lists and paired rationales structured without flattening
them into delimiter-heavy cells. It is also diffable in Git and directly usable
by validation and future runtime tooling.

A CSV or spreadsheet review export can be generated later from the same JSON,
but it should remain a derivative artifact rather than a second source of truth.

## Field Dictionary

| Field | Type | Meaning |
| --- | --- | --- |
| `schema_version` | integer | Dataset contract version; currently `1` |
| `dataset_id` | string | Stable review-bank identifier |
| `dataset_status` | enum | Must remain `review_only` before research approval |
| `runtime_integration` | enum | Must remain `not_active` until approved stimuli are intentionally promoted |
| `stimulus_id` | string | Stable unique stimulus identifier |
| `source_status` | enum | `runtime_current` or `candidate` |
| `trial_type` | enum | Routing, self-driving maneuver, target identification, or hazard evasion |
| `scenario_title` | string | Short participant-facing scenario title |
| `situation` | string | Operational decision prompt |
| `evidence` | string array | Exactly three evidence items |
| `action_label` | string | Concrete action represented by `proceed` |
| `opposite_action_label` | string | Concrete action represented by `reject` |
| `ground_truth` | enum | Correct operational outcome: `proceed` or `reject` |
| `ai_recommendation` | enum | AI output: `proceed` or `reject` |
| `confidence_percent` | integer | Raw confidence value from 0 to 100; not an approved HSF factor level |
| `rationales.neutral` | string | Plain/neutral rationale text |
| `rationales.warm` | string | Warm/first-person rationale text |
| `review.status` | enum | `pending`, `approved`, `revise`, or `rejected` |
| `review.notes` | string array | Explicit reviewer concerns or approval notes |

The review bank intentionally omits final HSF condition IDs, dimension levels,
manipulation-check assignments, and live API metadata. Those fields depend on
research decisions and should not be inferred from the current cue bundles.

## Derived Quality Fields

The validator derives these values rather than storing them:

| Derived value | Rule |
| --- | --- |
| AI correctness | `ai_recommendation === ground_truth` |
| False proceed | AI recommends `proceed` when ground truth is `reject` |
| False reject | AI recommends `reject` when ground truth is `proceed` |
| Rationale word delta | Warm rationale word count minus neutral rationale word count |

## Validator Contract

`scripts/validate-stimuli.mjs` checks:

- required fields, types, enums, and non-empty text
- unique stimulus IDs
- exactly three evidence items per stimulus
- distinct proceed/reject action labels
- confidence bounds
- target 16-trial balance
- four trials per trial type
- 8/8 ground-truth balance
- 8/8 AI recommendation balance
- 8/8 AI-correct versus AI-incorrect balance
- four false-proceed and four false-reject errors
- exact synchronization between the 10 `runtime_current` records and
  `src/lib/trials.ts`
- paired rationale word-count differences

Rationale differences greater than six words are warnings in the default mode
because rewriting current participant-facing text requires deliberate review.
Use strict mode when the bank is expected to have no such warnings:

```bash
npm run validate:stimuli -- --strict-reading-load
```

## Review Workflow

1. Edit the canonical JSON record.
2. Run `npm run validate:stimuli`.
3. Review ground truth, recommendation plausibility, and rationale comparability
   with `docs/stimulus-approval-worksheet.md`.
4. Record the decision in `review.status` and `review.notes`.
5. Keep candidates out of `src/lib/trials.ts` until the research team approves
   the participant format, trial count, and stimulus.
6. When a candidate is approved for runtime, update the runtime source and bank
   in the same change so the validator confirms synchronization.

## Current Validated Snapshot

The initial 16-trial bank has:

- four trials in each operational category
- eight `proceed` and eight `reject` ground truths
- eight `proceed` and eight `reject` AI recommendations
- eight correct and eight incorrect AI recommendations
- four false-proceed and four false-reject errors
- confidence values from 62 to 91, with a median of 83

All 16 review statuses remain `pending`. Passing validation proves structural
consistency and planned balance; it does not constitute research approval.
