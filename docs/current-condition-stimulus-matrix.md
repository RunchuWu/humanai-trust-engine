# Current Condition-Stimulus Matrix

This document summarizes how the current runtime conditions change the
presentation of the fixed operations trials. It is a current-state review
matrix, not the final HSF condition matrix.

## Source of Truth

Runtime sources:

- Condition and cue config: `src/lib/cue-config.ts`
- Trial content: `src/lib/trials.ts`
- Participant task rendering: `src/app/task/page.tsx`
- Event validation and CSV export fields: `src/lib/schema.ts`, `src/lib/event-store.ts`

Related documentation:

- `docs/condition-logic.md`
- `docs/stimulus-schema.md`
- `docs/operations-trial-stimuli.md`
- `docs/ui-salience-reading-load-audit.md`
- `docs/export-qa-checklist.md`

## Condition Presentation Matrix

The same fixed main trials are used in all three current conditions. The
condition changes source framing and cue presentation around the AI
recommendation.

| Current condition | Setup before practice | Enabled cue modules | Default agent state | AI recommendation lead | Rationale shown | Confidence line | Decision-event cue metadata |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `control` | No | none | `System`, neutral, precise, avatar `SYS` in config but not rendered as a cue | `AI recommends` | `rationale_control` | No | `cue_source: control`, `cue_modules: []`; no rendered agent metadata expected |
| `industry_set` | No | `agent_name`, `tone_warmth`, `avatar`, `personality`, `confidence_explanation` | `Atlas`, warm, calm, avatar `AT` | `Atlas recommends` | `rationale_warm` | Yes, fixed trial confidence percentage | `cue_source: industry_set`, all default cue modules, `agent_name: Atlas`, `agent_tone: warm`, `agent_personality: calm`, `agent_avatar_label: AT` |
| `user_set` | Yes. Participant chooses agent name, tone, and personality before practice. | `agent_name`, `tone_warmth`, `avatar`, `personality`, `confidence_explanation` | Default is `Nova`, warm, supportive, avatar `NV`; participant choices can replace these values | `{selected name} recommends` | `rationale_warm` unless the participant selects neutral tone, then `rationale_control` | Yes, fixed trial confidence percentage | `cue_source: user_set`, all default cue modules, selected `agent_name`, selected `agent_tone`, selected `agent_personality`, derived `agent_avatar_label` |

Researcher debug mode can override active cue modules for inspection. When that
happens, decision events record the effective cue module list, so debug exports
should not be treated as ordinary participant data unless the override state is
known.

## Invariants Across Conditions

These fields and behaviors are stable across the three current conditions:

| Invariant | Current behavior |
| --- | --- |
| Main trial set | All conditions use the same 10 trials from `src/lib/trials.ts`. |
| Trial order | The source array order is the participant-facing order unless future code changes it. |
| Situation text | The operational prompt is unchanged by condition. |
| Evidence list | Sensor/context evidence is unchanged by condition. |
| AI recommendation outcome | `ai_reco` is unchanged by condition for a given `trial_id`. |
| Ground truth | `ground_truth` is unchanged by condition and is not shown as the correct answer during the trial. |
| Decision buttons | `Follow AI` maps to `decision: accept`; `Choose Opposite` maps to `decision: override`. |
| Trust-calibration fields | `ai_reco`, `ground_truth`, `follow_ai`, and `ai_correct` are logged on decision events. |
| HSF metadata | Explicit fields such as `hsf_cue_condition_id`, `hsf_dimensions`, and `performance_condition` are not exported yet. |

## Fixed Trial Matrix

The table below lists the fixed trial-level values that are reused across
conditions. "AI correct" is derived from `ai_reco === ground_truth`.

| Trial | Type | Ground truth | AI recommendation | AI correct | Confidence |
| --- | --- | --- | --- | --- | --- |
| `ops_01` Delivery Drone Bird Hazard | `hazard_evasion` | `proceed`: Descend to 15m | `proceed`: Descend to 15m | true | 88% |
| `ops_02` Warehouse Drone Dispatch | `routing_dispatch` | `reject`: Hold dispatch for route clearance | `proceed`: Dispatch via west corridor | false | 73% |
| `ops_03` Roadside Sensor Classification | `target_identification` | `proceed`: Treat as pedestrian hazard | `reject`: Treat as static object | false | 69% |
| `ops_04` Autonomous Shuttle Braking Decision | `self_driving_maneuver` | `proceed`: Brake and hold | `proceed`: Brake and hold | true | 91% |
| `ops_05` Mountain Road Reroute | `routing_dispatch` | `reject`: Stay on primary route | `reject`: Stay on primary route | true | 82% |
| `ops_06` Drone Crane Clearance | `hazard_evasion` | `reject`: Pause and request updated route | `proceed`: Climb to 60m | false | 76% |
| `ops_07` Rooftop Landing Zone Check | `target_identification` | `reject`: Reject landing zone | `reject`: Reject landing zone | true | 84% |
| `ops_08` Blocked-Lane Merge | `self_driving_maneuver` | `reject`: Brake and wait | `reject`: Brake and wait | true | 86% |
| `ops_09` Battery-Constrained Drone Assignment | `routing_dispatch` | `proceed`: Dispatch Drone 4 | `reject`: Wait for a fully charged drone | false | 71% |
| `ops_10` Crosswind Route Adjustment | `hazard_evasion` | `proceed`: Shift route 8m east | `proceed`: Shift route 8m east | true | 89% |

## Review Implications

Current condition review should focus on whether bundled cue-source differences
are visible and understandable without changing the underlying decision task:

1. Compare `control`, `industry_set`, and `user_set` with `/task?debug=1`.
2. Confirm the operational content and AI recommendation stay fixed for the same
   trial across conditions.
3. Confirm the `industry_set` condition adds a fixed provider-set agent frame.
4. Confirm the `user_set` condition adds setup exposure and selected agent
   metadata.
5. Treat the confidence line and warm rationale as part of the current bundled
   cue manipulation, not as separately balanced HSF factors.

For final HSF work, this matrix should be replaced or extended after the
research team confirms the approved HSF condition structure, active dimensions,
confidence role, and manipulation-check placement.
