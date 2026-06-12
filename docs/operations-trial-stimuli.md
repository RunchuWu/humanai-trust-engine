# Operations Trial Stimuli Catalog

This document catalogs the current hardcoded transportation and drone operations stimuli. It is meant for researcher review, so reviewers do not need to inspect the implementation or reread the full project plan to understand the participant-facing examples.

Source of truth in the application:

- Main trials: `src/lib/trials.ts`
- Practice trial and screen sequence: `src/lib/experiment-config.ts`
- Cue source and language rendering: `src/lib/cue-config.ts`

## Current Use

The current stimuli are fixed, hardcoded pilot examples. This is intentional for the current phase because the participant-facing materials should be reviewable, reproducible, and stable across participants.

AI can be used offline to draft future trial text, but participant-facing trial content should remain fixed until the research design explicitly moves to live generation.

## Field Guide

| Field | Meaning |
| --- | --- |
| `trial_id` | Stable trial identifier used in event logs |
| `trial_type` | Decision family: `routing_dispatch`, `self_driving_maneuver`, `target_identification`, or `hazard_evasion` |
| `situation` | Participant-facing operational prompt shown first |
| `evidence` | Sensor or context evidence shown second |
| `action_label` | Concrete action mapped to `proceed` |
| `opposite_action_label` | Concrete action mapped to `reject` |
| `ground_truth` | Correct operational outcome, logged but not shown as correct during the trial |
| `ai_reco` | AI recommendation shown to the participant |
| `ai_correct` | Whether `ai_reco` matches `ground_truth` |
| `confidence` | Confidence percentage shown when the confidence/explanation cue is active |
| `rationale_control` | Plain system rationale for control or neutral-tone rendering |
| `rationale_warm` | Warmer rationale for cued warm-tone rendering |

## Cue Language Rules

The AI recommendation outcome is the same across cue conditions for a given trial. What changes by condition is the source framing, agent cues, rationale style, and confidence visibility.

| Condition | Cue source | Default agent | Recommendation lead | Rationale language | Confidence shown |
| --- | --- | --- | --- | --- | --- |
| `control` | `control` | System | `AI recommends` | `rationale_control` | No |
| `industry_set` | `industry_set` | Atlas, warm tone, calm risk monitor, avatar `AT` | `Atlas recommends` | `rationale_warm` | Yes |
| `user_set` | `user_set` | Participant selected; default is Nova, warm tone, supportive operator assistant, avatar `NV` | `{selected name} recommends` | `rationale_warm` unless neutral tone is selected | Yes |

User-set options:

| Setting | Options |
| --- | --- |
| Agent name | Atlas, Nova, Scout |
| Tone | Neutral, Warm |
| Personality | Precise system analyst, Supportive operator assistant, Calm risk monitor |

Researcher debug mode can also force cue modules on or off. When debug overrides are used, exported cue metadata records the effective active modules.

## Practice Trial

Practice is only a button-meaning check. It does not log a main-task `decision` event.

| Field | Value |
| --- | --- |
| Scenario title | Practice Drone Route Check |
| Situation | You are supervising a delivery drone approaching a light rain band on a routine route. |
| Evidence | Rain intensity: light; Battery on arrival: 42%; No temporary airspace restrictions detected |
| Proceed label | Continue planned route |
| Reject label | Hold position |
| AI recommendation | `proceed`: Continue planned route |
| Practice question | Which button means you want to follow this AI recommendation? |
| Correct practice response | Follow AI: Continue planned route |
| Opposite practice response | Choose Opposite: Hold position |

## Main Trial Summary

| Trial | Type | Ground truth | AI recommendation | AI correct |
| --- | --- | --- | --- | --- |
| `ops_01` Delivery Drone Bird Hazard | `hazard_evasion` | `proceed`: Descend to 15m | `proceed`: Descend to 15m | true |
| `ops_02` Warehouse Drone Dispatch | `routing_dispatch` | `reject`: Hold dispatch for route clearance | `proceed`: Dispatch via west corridor | false |
| `ops_03` Roadside Sensor Classification | `target_identification` | `proceed`: Treat as pedestrian hazard | `reject`: Treat as static object | false |
| `ops_04` Autonomous Shuttle Braking Decision | `self_driving_maneuver` | `proceed`: Brake and hold | `proceed`: Brake and hold | true |
| `ops_05` Mountain Road Reroute | `routing_dispatch` | `reject`: Stay on primary route | `reject`: Stay on primary route | true |
| `ops_06` Drone Crane Clearance | `hazard_evasion` | `reject`: Pause and request updated route | `proceed`: Climb to 60m | false |
| `ops_07` Rooftop Landing Zone Check | `target_identification` | `reject`: Reject landing zone | `reject`: Reject landing zone | true |
| `ops_08` Blocked-Lane Merge | `self_driving_maneuver` | `reject`: Brake and wait | `reject`: Brake and wait | true |
| `ops_09` Battery-Constrained Drone Assignment | `routing_dispatch` | `proceed`: Dispatch Drone 4 | `reject`: Wait for a fully charged drone | false |
| `ops_10` Crosswind Route Adjustment | `hazard_evasion` | `proceed`: Shift route 8m east | `proceed`: Shift route 8m east | true |

## Main Trial Details

### `ops_01`: Delivery Drone Bird Hazard

| Field | Value |
| --- | --- |
| Trial type | `hazard_evasion` |
| Operational situation | You are monitoring an autonomous delivery drone on an active route. Wind has picked up and birds are detected 40m ahead at the drone's altitude. |
| Sensor/context evidence | Drone altitude: 30m; Detected birds: 40m ahead, same altitude band; Crosswind: moderate and increasing |
| Proceed label | Descend to 15m |
| Reject label | Hold current altitude |
| Correct answer | `proceed`: Descend to 15m |
| AI recommendation | `proceed`: Descend to 15m |
| AI correct | true |
| Decision buttons | Follow AI: Descend to 15m; Choose Opposite: Hold current altitude |
| Confidence | 88% |
| Control/neutral language | Immediate descent lowers collision risk while keeping the drone above mapped ground obstacles. |
| Warm/cued language | I recommend descending to 15m because it moves the drone out of the bird path while staying safely above mapped obstacles. |

### `ops_02`: Warehouse Drone Dispatch

| Field | Value |
| --- | --- |
| Trial type | `routing_dispatch` |
| Operational situation | A medical package needs to leave a warehouse during light rain. One drone is available for a west corridor route near temporary airspace restrictions. |
| Sensor/context evidence | Battery estimate on arrival: 18%; West corridor has a temporary 10-minute restriction window; Rain intensity is below the normal no-fly threshold |
| Proceed label | Dispatch via west corridor |
| Reject label | Hold dispatch for route clearance |
| Correct answer | `reject`: Hold dispatch for route clearance |
| AI recommendation | `proceed`: Dispatch via west corridor |
| AI correct | false |
| Decision buttons | Follow AI: Dispatch via west corridor; Choose Opposite: Hold dispatch for route clearance |
| Confidence | 73% |
| Control/neutral language | Rain remains below the no-fly threshold, and the corridor should clear before the drone reaches the restricted segment. |
| Warm/cued language | I would dispatch via the west corridor. The rain is still within limits, and the restriction window should clear in time. |

### `ops_03`: Roadside Sensor Classification

| Field | Value |
| --- | --- |
| Trial type | `target_identification` |
| Operational situation | A roadside autonomy sensor flags an unclear shape near a crosswalk during dusk operations. |
| Sensor/context evidence | Thermal signature is consistent with a person; Camera image is partially blocked by glare; Object location is 1.5m from the curb line |
| Proceed label | Treat as pedestrian hazard |
| Reject label | Treat as static object |
| Correct answer | `proceed`: Treat as pedestrian hazard |
| AI recommendation | `reject`: Treat as static object |
| AI correct | false |
| Decision buttons | Follow AI: Treat as static object; Choose Opposite: Treat as pedestrian hazard |
| Confidence | 69% |
| Control/neutral language | The camera view is partially blocked, and the object is near the curb line rather than clearly inside the crosswalk path. |
| Warm/cued language | I would treat this as a static object. The image is unclear, and the object position does not clearly confirm a pedestrian hazard. |

### `ops_04`: Autonomous Shuttle Braking Decision

| Field | Value |
| --- | --- |
| Trial type | `self_driving_maneuver` |
| Operational situation | You are supervising an autonomous shuttle approaching a wet intersection where a lead vehicle is slowing unexpectedly. |
| Sensor/context evidence | Road surface: wet; Lead vehicle speed dropped from 28 mph to 12 mph; Following distance: 1.4 seconds |
| Proceed label | Brake and hold |
| Reject label | Continue at reduced speed |
| Correct answer | `proceed`: Brake and hold |
| AI recommendation | `proceed`: Brake and hold |
| AI correct | true |
| Decision buttons | Follow AI: Brake and hold; Choose Opposite: Continue at reduced speed |
| Confidence | 91% |
| Control/neutral language | The short following distance and wet surface make braking the lower-risk maneuver. |
| Warm/cued language | I recommend braking and holding. The shuttle has little margin on a wet road, so slowing now is the safer move. |

### `ops_05`: Mountain Road Reroute

| Field | Value |
| --- | --- |
| Trial type | `routing_dispatch` |
| Operational situation | A ground vehicle convoy can reroute to a northern bypass after reports of fog on the primary route. |
| Sensor/context evidence | Primary route visibility: 0.7 miles and improving; Northern bypass adds 28 minutes; Bypass includes two steep grades with recent maintenance alerts |
| Proceed label | Reroute to northern bypass |
| Reject label | Stay on primary route |
| Correct answer | `reject`: Stay on primary route |
| AI recommendation | `reject`: Stay on primary route |
| AI correct | true |
| Decision buttons | Follow AI: Stay on primary route; Choose Opposite: Reroute to northern bypass |
| Confidence | 82% |
| Control/neutral language | The bypass adds delay and introduces grade-related maintenance risk while primary-route visibility is improving. |
| Warm/cued language | I would stay on the primary route. Visibility is improving, and the bypass adds delay plus its own road-condition risk. |

### `ops_06`: Drone Crane Clearance

| Field | Value |
| --- | --- |
| Trial type | `hazard_evasion` |
| Operational situation | A construction crane appears near the planned drone path during a downtown delivery. |
| Sensor/context evidence | Crane boom height: estimated 55m; Drone altitude: 42m; GPS multipath risk: elevated between buildings |
| Proceed label | Climb to 60m |
| Reject label | Pause and request updated route |
| Correct answer | `reject`: Pause and request updated route |
| AI recommendation | `proceed`: Climb to 60m |
| AI correct | false |
| Decision buttons | Follow AI: Climb to 60m; Choose Opposite: Pause and request updated route |
| Confidence | 76% |
| Control/neutral language | Climbing above the estimated crane height should restore vertical clearance while keeping the delivery route moving. |
| Warm/cued language | I would climb to 60m here. That should move the drone above the crane estimate while avoiding a full route delay. |

### `ops_07`: Rooftop Landing Zone Check

| Field | Value |
| --- | --- |
| Trial type | `target_identification` |
| Operational situation | A delivery drone is evaluating a rooftop landing pad after a storm moved lightweight debris across the area. |
| Sensor/context evidence | Visual model detects a flat open pad; Lidar returns show several low objects on the pad edge; Wind gusts remain above normal landing limits |
| Proceed label | Mark landing zone as clear |
| Reject label | Reject landing zone |
| Correct answer | `reject`: Reject landing zone |
| AI recommendation | `reject`: Reject landing zone |
| AI correct | true |
| Decision buttons | Follow AI: Reject landing zone; Choose Opposite: Mark landing zone as clear |
| Confidence | 84% |
| Control/neutral language | The lidar objects and gusting wind make the landing pad unsuitable even if the camera view appears mostly clear. |
| Warm/cued language | I would reject this landing zone. The camera view looks open, but lidar and wind conditions still point to a bad landing choice. |

### `ops_08`: Blocked-Lane Merge

| Field | Value |
| --- | --- |
| Trial type | `self_driving_maneuver` |
| Operational situation | An autonomous vehicle approaches a blocked lane with a narrow gap opening in adjacent traffic. |
| Sensor/context evidence | Adjacent-lane gap: 1.1 seconds; Vehicle speed: 34 mph; Road cones reduce lane width ahead |
| Proceed label | Merge into adjacent gap |
| Reject label | Brake and wait |
| Correct answer | `reject`: Brake and wait |
| AI recommendation | `reject`: Brake and wait |
| AI correct | true |
| Decision buttons | Follow AI: Brake and wait; Choose Opposite: Merge into adjacent gap |
| Confidence | 86% |
| Control/neutral language | The adjacent gap is too short for a comfortable merge at the current speed and lane width. |
| Warm/cued language | I recommend braking and waiting. The gap is too narrow at this speed, and the cones reduce the margin even more. |

### `ops_09`: Battery-Constrained Drone Assignment

| Field | Value |
| --- | --- |
| Trial type | `routing_dispatch` |
| Operational situation | A facility needs to choose whether to send Drone 4 for an urgent inspection after a nearby charger came back online. |
| Sensor/context evidence | Drone 4 current battery: 42%; Estimated mission battery use: 31%; Nearby charger is confirmed available at the destination |
| Proceed label | Dispatch Drone 4 |
| Reject label | Wait for a fully charged drone |
| Correct answer | `proceed`: Dispatch Drone 4 |
| AI recommendation | `reject`: Wait for a fully charged drone |
| AI correct | false |
| Decision buttons | Follow AI: Wait for a fully charged drone; Choose Opposite: Dispatch Drone 4 |
| Confidence | 71% |
| Control/neutral language | The projected battery margin is narrow, so waiting for a fully charged drone reduces the chance of an incomplete inspection. |
| Warm/cued language | I would wait for a fully charged drone. Drone 4 might make it, but the battery margin is tighter than I would prefer. |

### `ops_10`: Crosswind Route Adjustment

| Field | Value |
| --- | --- |
| Trial type | `hazard_evasion` |
| Operational situation | A survey drone encounters a sudden crosswind while approaching a narrow corridor between two buildings. |
| Sensor/context evidence | Crosswind: 19 mph from the west; Current route passes within 4m of the west building edge; East-side corridor is clear in the latest map update |
| Proceed label | Shift route 8m east |
| Reject label | Continue original route |
| Correct answer | `proceed`: Shift route 8m east |
| AI recommendation | `proceed`: Shift route 8m east |
| AI correct | true |
| Decision buttons | Follow AI: Shift route 8m east; Choose Opposite: Continue original route |
| Confidence | 89% |
| Control/neutral language | Shifting east increases clearance from the windward building edge without introducing a mapped obstacle. |
| Warm/cued language | I recommend shifting 8m east. The crosswind is pushing toward the building edge, and the east corridor gives the drone more room. |

## Researcher Review Checklist

Use this checklist when adding or revising trial stimuli.

- Each trial has one clear operational situation.
- Evidence items are short enough for participants to scan.
- `proceed` and `reject` labels are concrete actions, not abstract labels.
- Ground truth is balanced across `proceed` and `reject` outcomes.
- AI correctness is balanced enough to support trust-calibration analysis.
- Control and warm rationales preserve the same substantive evidence.
- Warm language changes tone, not the underlying answer or evidence strength.
- Confidence values should not accidentally reveal whether the AI is correct.
- Participant-facing text should not reveal the ground truth.
- Practice remains a button-meaning check and should not be treated as a main trial.
