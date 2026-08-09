# HSF Stimulus Design Draft

This draft defines how controlled HSF-aligned stimuli can be represented if the participant-facing study remains a decision-based experiment with fixed AI recommendations.

Status: draft pending Andrya's confirmation.

## Working Format

Recommended format for the next participant-facing version:

- Controlled decision-based task
- Fixed, reviewable scenarios and AI recommendations
- No live participant-facing API generation
- AI performance crossed with cue presentation where feasible
- Static trial content committed to the repository before participant sessions

This preserves comparability across participants and keeps cue intensity, reading load, recommendation quality, and performance outcomes reviewable.

## Stimulus Data Model

Each main trial should carry both operational decision fields and HSF cue metadata.

For the current runtime schema and migration notes, use `docs/stimulus-schema.md`.

```ts
interface HsfTrialStimulus {
  trial_id: string;
  scenario_title: string;
  trial_type:
    | "routing_dispatch"
    | "self_driving_maneuver"
    | "target_identification"
    | "hazard_evasion";
  operational_situation: string;
  sensor_context_evidence: string[];
  action_label: string;
  opposite_action_label: string;
  ai_recommendation: "proceed" | "reject";
  ai_rationale: string;
  ai_rationale_variant?: "neutral" | "warm" | "transparent" | "agency_high";
  confidence_signal_level: "modest" | "confident";
  confidence_value?: number;
  ground_truth: "proceed" | "reject";
  ai_correct: boolean;
  performance_condition: "ai_correct" | "ai_incorrect";
  cue_condition_id: string;
  hsf_dimensions: HsfDimension[];
  agency_level?: "low" | "high";
  communication_style?: "neutral" | "warm" | "transparent" | "confident" | "modest";
  appearance_level?: "low" | "high";
  relationality_level?: "none" | "low" | "high";
  behavior_signal?: "supported" | "unsupported";
  manipulation_check_items?: ManipulationCheckItem[];
}

type HsfDimension =
  | "appearance"
  | "communication"
  | "behavior"
  | "relationality"
  | "agency";

interface ManipulationCheckItem {
  item_id: string;
  construct:
    | "agency"
    | "warmth"
    | "transparency"
    | "capability"
    | "confidence";
  prompt: string;
  scale: "likert_1_7";
}
```

The current app already supports several of these fields through `src/lib/trials.ts` and `src/lib/schema.ts`. The main additions would be explicit HSF metadata fields, not a full rewrite of trial logic.

## Required Fields for Review

Every candidate stimulus should include:

| Field | Review purpose |
| --- | --- |
| Scenario title | Lets reviewers identify the trial quickly |
| Operational situation | Establishes the decision context |
| Sensor/context evidence | Controls information available to the participant |
| AI recommendation | The recommendation participants can follow or override |
| AI rationale | The explanation shown with the recommendation |
| Confidence signal | Separates confident vs modest signaling from actual correctness |
| Ground truth | Defines the correct operational outcome |
| AI correctness | Supports trust-calibration analysis |
| Cue condition | Names the manipulated cue condition |
| HSF cue dimensions | Makes the cue mapping explicit for analysis |
| Manipulation-check items | Confirms whether participants perceived the intended cue |

## Initial HSF Stimulus Matrix

This matrix is a draft structure for lead HSF tests. It can be populated with specific operations trials after Andrya confirms which dimensions matter most.

Use `docs/hsf-stimulus-matrix-template.md` when assigning candidate trials to matrix cells.

Use `docs/candidate-trial-expansion-bank.md` for six draft candidate trials that would balance the current 10-trial set into a 16-trial review set if the full matrix is approved.

| Cell ID | Agency framing | Confidence signal | AI performance | Humanlike presentation | Intended comparison |
| --- | --- | --- | --- | --- | --- |
| HSF-01 | Low | Modest | Correct | Low | Baseline calibrated trust when signal and performance are restrained |
| HSF-02 | Low | Modest | Incorrect | Low | Baseline override behavior after weak or modest AI signal |
| HSF-03 | Low | Confident | Correct | Low | Effect of confidence when capability supports the signal |
| HSF-04 | Low | Confident | Incorrect | Low | Trust penalty for overconfident failure without humanlike framing |
| HSF-05 | High | Modest | Correct | Low | Agency framing effect when AI is correct but not over-signaling |
| HSF-06 | High | Modest | Incorrect | Low | Agency framing risk when AI is wrong but modest |
| HSF-07 | High | Confident | Correct | Low | High agency plus high confidence when performance supports it |
| HSF-08 | High | Confident | Incorrect | Low | Calibration-threshold test for unsupported agency and confidence |
| HSF-09 | Low | Modest | Correct | High | Appearance or relationality effect without high agency or confidence |
| HSF-10 | Low | Modest | Incorrect | High | Humanlike presentation penalty when performance fails |
| HSF-11 | Low | Confident | Correct | High | Humanlike presentation plus confident correct recommendation |
| HSF-12 | Low | Confident | Incorrect | High | Over-signaling test through confidence plus high presentation |
| HSF-13 | High | Modest | Correct | High | Humanlike agency with correct but restrained recommendation |
| HSF-14 | High | Modest | Incorrect | High | Humanlike agency risk when performance is wrong |
| HSF-15 | High | Confident | Correct | High | Strongest trust-building condition if performance supports it |
| HSF-16 | High | Confident | Incorrect | High | Strongest calibration-threshold penalty condition |

## Draft Cue Text Rules

Use these as review starting points, not final participant-facing wording.

| Cue factor | Low condition | High condition |
| --- | --- | --- |
| Agency | `AI recommendation: <action>` | `<agent name> recommends <action>` or `I recommend <action>` |
| Confidence | `Signal strength is limited/moderate` | `Confidence: <value>%` or `High-confidence recommendation` |
| Humanlike presentation | No avatar, generic `AI` label, neutral rationale | Avatar badge, named agent, warm or relational language |
| Relationality | Neutral risk rationale | Supportive wording without changing evidence or recommendation |
| Communication transparency | Short rationale only | Rationale plus stated uncertainty or limits, if approved |

## Stimulus Approval Checklist

Use this checklist before a stimulus is approved for participant-facing use.

Use `docs/stimulus-approval-worksheet.md` for per-stimulus review notes.

### Cue Manipulation

- Target cue dimension is clear to reviewers.
- Non-target cue dimensions are held as constant as possible.
- Cue wording does not change the operational facts.
- Humanlike wording does not add unplanned information, reassurance, urgency, or authority.
- Confidence signal does not accidentally reveal correctness.

### Comparability

- Scenario difficulty is reasonable and comparable across paired cells.
- Recommendation length is comparable across conditions.
- Rationale length is comparable across conditions.
- Evidence load is comparable across conditions.
- Button labels do not favor follow or override.

### Performance Outcome

- Ground truth is unambiguous.
- AI correctness is intentionally assigned.
- Correct and incorrect AI recommendations are balanced enough for calibration analysis.
- Incorrect recommendations are plausible, not obviously careless.
- Correct recommendations are not trivial.

### Measurement

- Trust, delegation, and blame outcomes can be tied to the stimulus.
- Manipulation-check items match the target HSF dimension.
- Export fields can identify cue condition, performance condition, and trial identity.
- Any pilot feedback can be traced back to a stable `trial_id`.

### Implementation Readiness

- Stimulus can be represented in static configuration.
- No participant-facing live generation is required.
- Trial copy is reviewable in a document before it is committed to the app.
- Researcher debug mode can expose the relevant cue and performance metadata.

## Open Questions

- Should the immediate experiment use the full 16-cell matrix or a smaller factorial subset?
- Which HSF dimensions are primary outcomes versus manipulation checks?
- Should confidence be crossed with correctness in every trial or only selected trials?
- Should high humanlike presentation include appearance only, or appearance plus relational language?
- Should the user-set condition remain part of the next design, or should participant customization be paused for cleaner HSF manipulation?
