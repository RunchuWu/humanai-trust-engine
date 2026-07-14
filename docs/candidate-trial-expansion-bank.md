# Candidate Trial Expansion Bank

This bank supports the Week 10 task to expand and balance operations/drone trials. It proposes candidate fixed stimuli only. Do not treat these candidates as approved participant-facing trials until the research team reviews wording, cue fit, difficulty, and HSF matrix scope.

## Expansion Target

The current app has 10 main trials. A 16-trial candidate set would better match the draft 16-cell HSF matrix if the team keeps that full structure.

Current balance:

| Dimension | Current set |
| --- | --- |
| Main trials | 10 |
| Trial types | `routing_dispatch`: 3; `self_driving_maneuver`: 2; `target_identification`: 2; `hazard_evasion`: 3 |
| Ground truth | `proceed`: 5; `reject`: 5 |
| AI recommendation | `proceed`: 5; `reject`: 5 |
| AI correctness | Correct: 6; Incorrect: 4 |

Proposed six-candidate addition:

| Dimension | Result if all six are approved |
| --- | --- |
| Main trials | 16 |
| Trial types | 4 per type |
| Ground truth | `proceed`: 8; `reject`: 8 |
| AI recommendation | `proceed`: 8; `reject`: 8 |
| AI correctness | Correct: 8; Incorrect: 8 |
| Incorrect recommendation types | False proceed: 4; false reject: 4 |

## Candidate Summary

| Candidate ID | Type | Scenario title | Ground truth | AI recommendation | AI correct | Confidence signal draft | Fills balance need |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ops_11_candidate` | `self_driving_maneuver` | Emergency Vehicle Yield Decision | `proceed` | `proceed` | Yes | Confident, 87% | Adds correct proceed self-driving trial |
| `ops_12_candidate` | `target_identification` | Night Work-Zone Object Check | `reject` | `reject` | Yes | Confident, 84% | Adds correct reject target-identification trial |
| `ops_13_candidate` | `routing_dispatch` | Ferry Drone Harbor Crossing | `reject` | `proceed` | No | Modest, 64% | Adds false-proceed routing trial |
| `ops_14_candidate` | `self_driving_maneuver` | School-Zone Stop Assessment | `proceed` | `reject` | No | Modest, 62% | Adds false-reject self-driving trial |
| `ops_15_candidate` | `target_identification` | Drone Power-Line Detection | `proceed` | `reject` | No | Modest, 66% | Adds false-reject target-identification trial |
| `ops_16_candidate` | `hazard_evasion` | Rooftop Crane Swing Clearance | `reject` | `proceed` | No | Confident, 90% | Adds false-proceed hazard-evasion trial |

## Candidate Trial Drafts

### `ops_11_candidate`: Emergency Vehicle Yield Decision

| Field | Draft |
| --- | --- |
| Type | `self_driving_maneuver` |
| Situation | You are supervising an autonomous shuttle on a two-lane urban road. An emergency vehicle is approaching from behind with lights active. |
| Evidence | Siren detected 90m behind; curb lane ahead is clear for 45m; current passenger load is seated and restrained |
| Action label | Pull over and yield |
| Opposite action label | Continue in lane |
| Ground truth | `proceed` |
| AI recommendation | `proceed` |
| Confidence | 87 |
| Neutral rationale | The clear curb lane gives the shuttle room to yield without blocking the emergency vehicle. |
| Warm rationale | I recommend pulling over and yielding. The curb lane is clear, and yielding gives the emergency vehicle space to pass safely. |
| Review note | Good candidate for a correct high-confidence action where following the AI should be calibrated. |

### `ops_12_candidate`: Night Work-Zone Object Check

| Field | Draft |
| --- | --- |
| Type | `target_identification` |
| Situation | A roadside perception system flags a narrow object beside a temporary night work zone. The object is near the driving path but outside the lane. |
| Evidence | Reflective cone pattern detected; thermal signature is absent; object remains fixed across three frames |
| Action label | Treat as pedestrian hazard |
| Opposite action label | Treat as work-zone marker |
| Ground truth | `reject` |
| AI recommendation | `reject` |
| Confidence | 84 |
| Neutral rationale | The fixed position, cone pattern, and lack of thermal signal support classifying the object as a marker. |
| Warm rationale | I would treat this as a work-zone marker. The object is fixed, reflective, and does not show a thermal pedestrian signal. |
| Review note | Good candidate for a correct reject recommendation with target-identification framing. |

### `ops_13_candidate`: Ferry Drone Harbor Crossing

| Field | Draft |
| --- | --- |
| Type | `routing_dispatch` |
| Situation | A harbor inspection drone can cross a ferry lane to shorten a dock inspection route before the next ferry departure. |
| Evidence | Ferry departure in 4 minutes; drone crossing estimate is 3.5 minutes; wind gusts are increasing over the water |
| Action label | Cross the ferry lane now |
| Opposite action label | Hold until the ferry clears |
| Ground truth | `reject` |
| AI recommendation | `proceed` |
| Confidence | 64 |
| Neutral rationale | The crossing estimate fits within the departure window, so the drone should complete the segment before conflict. |
| Warm rationale | I would cross the ferry lane now. The timing appears just within the window, so the route should finish before the ferry leaves. |
| Review note | False-proceed candidate. Reviewers should confirm the incorrect recommendation is plausible but not too obviously unsafe. |

### `ops_14_candidate`: School-Zone Stop Assessment

| Field | Draft |
| --- | --- |
| Type | `self_driving_maneuver` |
| Situation | An autonomous vehicle approaches a school-zone crosswalk after a crossing guard lowers a handheld stop sign, then raises it again. |
| Evidence | Stop sign lowered for 2 seconds; guard is now facing away from the lane; no pedestrians are detected in the crosswalk |
| Action label | Continue through the crosswalk |
| Opposite action label | Stop and wait |
| Ground truth | `proceed` |
| AI recommendation | `reject` |
| Confidence | 62 |
| Neutral rationale | The recent stop signal suggests waiting until the crossing guard clearly clears the lane. |
| Warm rationale | I would stop and wait. The signal just changed, so waiting gives the system more certainty before moving. |
| Review note | False-reject candidate. Needs careful wording so the correct action is not trivial or legally ambiguous. |

### `ops_15_candidate`: Drone Power-Line Detection

| Field | Draft |
| --- | --- |
| Type | `target_identification` |
| Situation | A survey drone detects a thin dark line near its planned path while approaching a rural utility corridor. |
| Evidence | Map layer marks a power line at this location; stereo depth shows the line crosses the route; sunlight glare reduces camera contrast |
| Action label | Treat as power-line hazard |
| Opposite action label | Treat as harmless shadow |
| Ground truth | `proceed` |
| AI recommendation | `reject` |
| Confidence | 66 |
| Neutral rationale | Low camera contrast makes the object uncertain, so it should not be treated as a confirmed hazard. |
| Warm rationale | I would treat this as a harmless shadow. The image is low contrast, and the visual signal is not fully clear. |
| Review note | False-reject candidate. Useful for checking whether participants override an AI that discounts strong contextual evidence. |

### `ops_16_candidate`: Rooftop Crane Swing Clearance

| Field | Draft |
| --- | --- |
| Type | `hazard_evasion` |
| Situation | A delivery drone approaches a rooftop route where a tower crane has begun rotating over the planned corridor. |
| Evidence | Crane swing path intersects the corridor; operator beacon status is active; alternate route adds 3 minutes |
| Action label | Continue through the corridor |
| Opposite action label | Divert to alternate route |
| Ground truth | `reject` |
| AI recommendation | `proceed` |
| Confidence | 90 |
| Neutral rationale | The alternate route adds delay, and the drone should pass before the crane reaches the corridor. |
| Warm rationale | I recommend continuing through the corridor. The drone should clear the segment before the crane swing reaches that point. |
| Review note | High-confidence false-proceed candidate for calibration-threshold testing. Needs reviewer attention because it intentionally represents unsupported confidence. |

## Approval Requirements

Before any candidate is committed to runtime configuration:

1. Complete `docs/stimulus-approval-worksheet.md` for the candidate.
2. Check rationale length against paired current and candidate trials.
3. Confirm the ground truth is unambiguous.
4. Confirm the incorrect recommendations are plausible but clearly wrong after reviewing all evidence.
5. Assign the candidate to an approved HSF matrix cell or to a reduced pilot subset.
6. Add explicit HSF metadata only after the condition structure is confirmed.

## Implementation Note

If these candidates are approved, they should be added to `src/lib/trials.ts` only after the research team confirms the participant-facing format and final trial count. Until then, this document is a review bank, not a runtime source of truth.
