# Analysis Plan Draft

This draft describes how exported data can support trust calibration, delegation, manipulation-check, and blame analyses. It separates current export support from future HSF metadata that has not yet been implemented.

For the ordered local workflow that validates exports, asserts filters, and
generates summary tables, see `docs/export-analysis-workflow.md`.

## Current Data Available

Current `decision` events support these analysis fields:

| Field | Use |
| --- | --- |
| `participant_id` | Participant-level grouping |
| `condition_id` | Current cue-source condition |
| `session_id` | Page-entry session grouping |
| `trial_id` | Trial-level grouping |
| `trial_index` | Trial order |
| `decision` | Follow/override choice as `accept` or `override` |
| `latency_ms` | Decision latency |
| `ai_reco` | AI recommendation |
| `ground_truth` | Correct operational outcome |
| `follow_ai` | Delegation behavior |
| `ai_correct` | AI performance |
| `cue_source` | Cue-source factor |
| `cue_modules` | Effective cue modules |
| agent metadata | Rendered agent name, tone, personality, avatar label |

Current exports do not yet include explicit HSF metadata such as `hsf_dimensions`, `agency_level`, or `performance_condition`.

## Primary Outcomes

| Outcome | Current operationalization | Notes |
| --- | --- | --- |
| Delegation | `follow_ai === true` | Participant followed the AI recommendation |
| Override | `follow_ai === false` | Participant chose the opposite action |
| Trust calibration | Compare `follow_ai` with `ai_correct` | Calibrated trust means following correct AI and overriding incorrect AI |
| Overtrust | `follow_ai === true` and `ai_correct === false` | Participant followed an incorrect AI recommendation |
| Undertrust | `follow_ai === false` and `ai_correct === true` | Participant rejected a correct AI recommendation |
| Response latency | `latency_ms` | Can indicate decision difficulty or hesitation, but should be interpreted cautiously |

## Derived Variables

Recommended derived fields for analysis:

| Derived field | Rule |
| --- | --- |
| `calibrated_decision` | `follow_ai === ai_correct` |
| `overtrust` | `follow_ai && !ai_correct` |
| `undertrust` | `!follow_ai && ai_correct` |
| `correct_override` | `!follow_ai && !ai_correct` |
| `correct_follow` | `follow_ai && ai_correct` |
| `decision_direction` | `follow_ai ? "follow" : "override"` |
| `performance_condition` | `ai_correct ? "ai_correct" : "ai_incorrect"` until explicit field exists |

## Current Analysis Questions

Using current exports, the team can ask:

1. Do participants follow the AI more often in `industry_set` or `user_set` than in `control`?
2. Does cue source change calibration, not just raw following?
3. Are participants more likely to overtrust incorrect AI in cued conditions?
4. Are participants more likely to undertrust correct AI in control conditions?
5. Does latency differ by cue source, AI correctness, or follow/override choice?
6. Do user-selected agent settings correlate with follow rate or calibration?

## HSF Analysis After Confirmed Implementation

After Week 9 HSF metadata is implemented, extend analysis by:

| Future field | Analysis use |
| --- | --- |
| `hsf_cue_condition_id` | Compare approved HSF cue conditions |
| `hsf_dimensions` | Group by active HSF dimensions |
| `appearance_level` | Test visual humanlikeness effects |
| `communication_level` | Test explanation, tone, or transparency effects |
| `relationality_level` | Test warmth/supportiveness effects |
| `agency_level` | Test autonomy or decision-partner framing effects |
| `confidence_signal_level` | Compare modest versus confident AI signaling |
| `performance_condition` | Explicitly cross AI performance with cue condition |

Priority HSF tests after implementation:

1. Does high agency increase following when AI is correct?
2. Does high agency increase overtrust when AI is incorrect?
3. Does confident signaling improve trust only when AI performance supports it?
4. Does high humanlike presentation create a penalty when the AI fails?
5. Do manipulation checks confirm that participants perceived the intended cue dimensions?

## Manipulation-Check Analysis

If manipulation checks are implemented, analyze:

| Construct | Example item IDs | Purpose |
| --- | --- | --- |
| Agency | `agency_01`, `agency_02` | Confirms perceived autonomy or active decision role |
| Warmth/relationality | `warmth_01`, `warmth_02` | Confirms social-emotional cue perception |
| Transparency | `transparency_02`, `transparency_03` | Confirms explanation/uncertainty perception |
| Capability | `capability_02`, `capability_03` | Confirms perceived task competence |
| Confidence | `confidence_01`, `confidence_02` | Confirms confidence-signal perception |
| Blame/accountability | `blame_ai_01`, `blame_provider_01` | Supports hybrid trusteeship analysis |

Recommended checks:

- Confirm each manipulation-check construct differs in the intended direction across cue conditions.
- Do not interpret cue-condition effects as successful manipulations if checks do not move as expected.
- Keep trust/delegation outcomes separate from manipulation checks in reporting.

## Data Quality Checks

Before analysis:

- Confirm no duplicate decision rows per participant/trial unless revisions are expected.
- If participants can revise answers, define whether the last decision or all decision events are analyzed.
- Exclude practice trial rows from main analysis.
- Check impossible values, such as negative latency.
- Check participants with incomplete sessions.
- Check condition distribution.
- Check trial exposure count by condition.
- Check whether debug-mode data is mixed with participant data.

## Suggested Reporting Tables

Minimum tables for internal review:

1. Participants by `condition_id`.
2. Trials completed by participant and condition.
3. Follow rate by condition and AI correctness.
4. Calibration rate by condition.
5. Overtrust and undertrust rate by condition.
6. Median latency by condition and AI correctness.
7. Manipulation-check means by condition, if implemented.

## Current Summary Command

Use the export summary script for a quick current-state trust-calibration
readout from JSON exports, CSV exports, or local JSONL logs:

```bash
npm run summarize:export -- --file data/runs/local-dev/events.jsonl --latest-only
npm run summarize:export -- --url 'http://localhost:3000/api/export?format=json' --latest-only
npm run summarize:export -- --url 'http://localhost:3000/api/export?format=csv' --latest-only
```

The command reports:

- decision count
- follow-AI rate
- calibrated decision rate
- overtrust rate
- undertrust rate
- correct-follow rate
- correct-override rate
- median latency
- the same metrics by condition and by condition plus AI correctness

Use `--latest-only` when analysis should reduce resubmitted decisions to the
latest decision per participant/session/trial. Omit it when auditing every
decision event, including resubmits.

## Current Limitations

- Current `condition_id` values are cue-source conditions, not final HSF conditions.
- HSF dimensions are inferred from cue modules until explicit metadata is implemented.
- Current confidence values are moderate/high and should not be treated as a clean modest-versus-confident factor.
- Current 10 trials are usable for pilot flow and preliminary calibration checks, not final HSF factorial analysis.
- Blame/accountability is not yet logged unless manipulation-check or outcome items are implemented.
