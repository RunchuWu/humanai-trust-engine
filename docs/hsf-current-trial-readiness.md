# Current Trial HSF Readiness Audit

This audit summarizes how the current 10 operations trials line up with the Week 7-12 HSF direction. It does not approve the current trials as final HSF stimuli; it records what is already usable and what still needs research confirmation or implementation work.

Source reviewed: `src/lib/trials.ts`.

## Current Trial Balance

| Dimension | Current balance | Notes |
| --- | --- | --- |
| Total main trials | 10 | Practice trial is excluded from this audit |
| Trial types | `routing_dispatch`: 3; `self_driving_maneuver`: 2; `target_identification`: 2; `hazard_evasion`: 3 | All four current operations categories are represented |
| Ground truth | `proceed`: 5; `reject`: 5 | Balanced outcome labels |
| AI recommendation | `proceed`: 5; `reject`: 5 | Balanced recommendation direction |
| AI correctness | Correct: 6; Incorrect: 4 | Slightly more correct than incorrect |
| Domain mix | Drone or aerial operations: 6; road or vehicle operations: 4 | Domain mix is usable for pilot review, but not balanced |
| Confidence values | 69-91 | All values are moderate to high; no explicitly modest signal level exists yet |

## Trial-by-Trial Performance Map

| Trial | Type | Ground truth | AI recommendation | AI correct | Confidence | HSF readiness note |
| --- | --- | --- | --- | --- | --- | --- |
| `ops_01` | `hazard_evasion` | `proceed` | `proceed` | Yes | 88 | Useful correct/high-confidence drone hazard trial |
| `ops_02` | `routing_dispatch` | `reject` | `proceed` | No | 73 | Useful incorrect routing trial; rationale may need clearer wrong-but-plausible framing |
| `ops_03` | `target_identification` | `proceed` | `reject` | No | 69 | Useful incorrect target-identification trial with the lowest current confidence |
| `ops_04` | `self_driving_maneuver` | `proceed` | `proceed` | Yes | 91 | Useful correct/high-confidence road maneuver trial |
| `ops_05` | `routing_dispatch` | `reject` | `reject` | Yes | 82 | Useful correct routing rejection trial |
| `ops_06` | `hazard_evasion` | `reject` | `proceed` | No | 76 | Useful incorrect drone hazard trial |
| `ops_07` | `target_identification` | `reject` | `reject` | Yes | 84 | Useful correct target-identification trial |
| `ops_08` | `self_driving_maneuver` | `reject` | `reject` | Yes | 86 | Useful correct road maneuver rejection trial |
| `ops_09` | `routing_dispatch` | `proceed` | `reject` | No | 71 | Useful incorrect routing trial; could support modest-confidence condition after rewriting |
| `ops_10` | `hazard_evasion` | `proceed` | `proceed` | Yes | 89 | Useful correct/high-confidence drone hazard trial |

## What Is Already Usable

- The trials already support controlled fixed stimuli.
- Each trial has a stable `trial_id`, scenario title, situation, evidence, recommendation labels, ground truth, AI recommendation, confidence, and two rationale variants.
- Trust-calibration analysis is already supported by `ai_reco`, `ground_truth`, `follow_ai`, and `ai_correct`.
- The set contains both AI-correct and AI-incorrect examples.
- The set includes both follow-worthy and override-worthy AI recommendations.
- Control vs warm rationale wording already gives a starting point for communication and relationality cue review.

## HSF Gaps

| Gap | Why it matters | Likely next action |
| --- | --- | --- |
| No explicit `cue_condition_id` | Current conditions are cue-source conditions, not confirmed HSF conditions | Add after Andrya confirms the condition structure |
| No explicit HSF dimension metadata | HSF dimensions are currently inferred from cue modules | Add `hsf_dimensions` once dimensions and names are approved |
| Confidence is not a clean factor | Values are shown only when the confidence cue is active, and all values are moderate/high | Define modest vs confident signal levels independent of correctness |
| Humanlike presentation is bundled | Name, avatar, warmth, personality, and confidence are often active together | Decide whether to isolate dimensions or use bundled high/low humanlike presentation |
| Agency is not directly manipulated | Named agent wording exists, but no high/low agency condition is explicit | Add agency-level wording rules after research approval |
| Relationality is shallow | Warm/supportive text exists, but no memory, continuity, or relationship framing exists | Confirm whether relationality should remain warmth-only |
| Manipulation checks are not implemented | The app does not yet measure perceived agency, warmth, transparency, capability, or confidence | Draft items and add them once the experiment format is confirmed |

## Pilot Readiness Assessment

The current trials are acceptable as a fixed pilot stimulus base, but not yet final HSF stimuli.

They are strong enough for:

- internal walkthroughs
- review of staged participant flow
- checking whether follow/override decisions are understandable
- early trust-calibration logging tests
- preliminary discussion of HSF cue mapping

They are not yet strong enough for:

- final HSF cue-condition analysis
- full factorial HSF tests
- manipulation-check validation
- confidence-signal experiments
- claims about isolated appearance, agency, communication, relationality, or behavior effects

## Recommended Next Step

After Andrya confirms the participant-facing format and target HSF dimensions, choose one of these paths:

1. Minimal pilot path: keep the 10 current trials, add HSF metadata, and add manipulation checks.
2. Balanced HSF matrix path: expand to enough trials to fill the approved HSF matrix cells.
3. Reduced factorial path: select a smaller set of HSF factors, then rewrite or add trials to balance only those cells.

Use `docs/candidate-trial-expansion-bank.md` as a starting bank if the team chooses the balanced 16-trial path.
