# Internal Pilot Notes Template

Use this document to record internal pilot observations for the controlled decision-based task. It is a template and should be copied into a dated pilot note or filled in during review.

## Pilot Metadata

| Field | Value |
| --- | --- |
| Study run ID |  |
| Reviewer |  |
| Date |  |
| App URL |  |
| Browser/device |  |
| Condition reviewed | `control` / `industry_set` / `user_set` |
| Debug mode used | yes / no |
| Trials completed |  |

## Pre-Pilot Checks

| Check | Pass? | Notes |
| --- | --- | --- |
| Participant mode loads at `/task` |  |  |
| Debug mode loads at `/task?debug=1` |  |  |
| Condition forcing works in debug mode |  |  |
| Current cue source and cue modules are visible in debug mode |  |  |
| Trial staging works: situation, evidence, AI recommendation |  |  |
| Practice trial teaches button meaning |  |  |
| Export endpoints load JSON and CSV |  |  |

## Participant Flow Notes

| Flow area | Clear? | Notes |
| --- | --- | --- |
| Welcome and study framing |  |  |
| Consent screen |  |  |
| Instructions |  |  |
| Comprehension check |  |  |
| Agent setup, if `user_set` |  |  |
| Practice trial |  |  |
| Main task transition |  |  |
| Debrief |  |  |

## Trial Review

Record any trial where wording, evidence, recommendation, or decision actions need revision.

| Trial ID | Issue type | Notes | Suggested revision |
| --- | --- | --- | --- |
|  | role clarity / evidence clarity / rationale clarity / decision labels / reading load / other |  |  |

## Cue Review

| Cue area | Visible as intended? | Too salient or distracting? | Notes |
| --- | --- | --- | --- |
| Agent name |  |  |  |
| Warmth/tone |  |  |  |
| Avatar |  |  |  |
| Personality framing |  |  |  |
| Confidence/explanation |  |  |  |
| Overall cue bundle |  |  |  |

## Button and Layout Review

| Check | Pass? | Notes |
| --- | --- | --- |
| `Follow AI` and `Choose Opposite` have comparable visual weight |  |  |
| Button labels are understandable |  |  |
| Recommendation display does not make one choice visually dominant |  |  |
| Cue display does not crowd the decision controls |  |  |
| Text fits without overlap at the tested viewport |  |  |

## Export Review

| Field or export behavior | Present/correct? | Notes |
| --- | --- | --- |
| `participant_id` |  |  |
| `condition_id` |  |  |
| `session_id` |  |  |
| `trial_id` and `trial_index` |  |  |
| `decision` |  |  |
| `latency_ms` |  |  |
| `ai_reco` |  |  |
| `ground_truth` |  |  |
| `follow_ai` |  |  |
| `ai_correct` |  |  |
| cue metadata |  |  |
| no practice-trial decision row |  |  |

## HSF-Specific Review After Confirmed Implementation

Leave this section blank until the approved HSF runtime implementation exists.

| HSF check | Present/correct? | Notes |
| --- | --- | --- |
| HSF cue condition ID visible in debug mode |  |  |
| Active HSF dimensions visible in debug mode |  |  |
| Trial performance condition visible in debug mode |  |  |
| Confidence-signal level visible in debug mode |  |  |
| HSF fields present in decision export |  |  |
| Manipulation-check item responses export correctly |  |  |

## Issue Log

| Priority | Issue | Evidence | Proposed fix | Owner |
| --- | --- | --- | --- | --- |
| high / medium / low |  |  |  |  |

## Pilot Summary

Role and task clarity:

```text

```

Cue clarity:

```text

```

Stimulus clarity:

```text

```

Export/data readiness:

```text

```

Recommended next revisions:

```text

```

## Current Limitation

This template supports internal pilot documentation. It does not replace the need for Andrea's confirmation of HSF dimensions, final cue conditions, approved stimuli, and manipulation-check placement.
