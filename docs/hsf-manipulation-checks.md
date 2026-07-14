# HSF Manipulation-Check Draft

This is a draft item bank for perceived HSF cue dimensions and trust-calibration outcomes. Items should be reviewed by the research team before participant-facing use.

Recommended response scale for all agreement items:

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

| Placement | Use case | Tradeoff |
| --- | --- | --- |
| After every trial | Strongest trial-level linkage between cue exposure and perception | Adds participant burden and may reveal the manipulation |
| After selected trials | Balances measurement and burden | Requires careful sampling across conditions |
| End of task by block or condition | Lowest disruption to decision flow | Weaker trial-level linkage and more memory effects |

Recommended starting point: use a short end-of-task block for pilot review, then decide whether selected trial-level checks are needed.

## Core HSF Manipulation Checks

### Agency and Autonomy

Purpose: check whether the AI was perceived as agentic, autonomous, or intentional.

| Item ID | Draft item | Notes |
| --- | --- | --- |
| `agency_01` | The AI seemed to make its own operational judgment. | Direct agency perception |
| `agency_02` | The AI appeared to take an active role in the decision. | Autonomy/action framing |
| `agency_03` | The AI felt like a decision partner rather than just a tool. | Stronger social-agency wording; may overlap relationality |
| `agency_04_reverse` | The AI seemed like a passive information display. | Reverse-coded agency check |

### Warmth and Relationality

Purpose: check whether warm or supportive cue wording changed perceived relational orientation.

| Item ID | Draft item | Notes |
| --- | --- | --- |
| `warmth_01` | The AI communicated in a warm way. | Direct warmth check |
| `warmth_02` | The AI seemed supportive of my role as operator. | Role-support framing |
| `warmth_03` | The AI's explanation felt socially oriented. | Relationality check |
| `warmth_04_reverse` | The AI's communication felt purely mechanical. | Reverse-coded warmth check |

### Communication and Transparency

Purpose: check whether explanations are perceived as understandable and transparent without conflating transparency with correctness.

| Item ID | Draft item | Notes |
| --- | --- | --- |
| `transparency_01` | The AI gave enough reasoning for its recommendation. | Explanation sufficiency |
| `transparency_02` | I understood why the AI made its recommendation. | Comprehension |
| `transparency_03` | The AI made the uncertainty in the situation clear. | Uncertainty communication |
| `transparency_04_reverse` | The AI recommendation felt like a black box. | Reverse-coded transparency check |

### Capability and Behavior

Purpose: check whether demonstrated performance and rationale quality affect perceived capability.

| Item ID | Draft item | Notes |
| --- | --- | --- |
| `capability_01` | The AI seemed capable of handling this type of operational decision. | General capability |
| `capability_02` | The AI used the available evidence appropriately. | Evidence-use perception |
| `capability_03` | The AI's recommendation seemed operationally reliable. | Reliability perception |
| `capability_04_reverse` | The AI seemed likely to miss important operational risks. | Reverse-coded capability check |

### Confidence Signal

Purpose: check whether confidence or signal-strength cues are perceived as intended.

| Item ID | Draft item | Notes |
| --- | --- | --- |
| `confidence_01` | The AI sounded confident in its recommendation. | Direct confidence perception |
| `confidence_02` | The AI's recommendation signaled a high level of certainty. | Certainty signal |
| `confidence_03` | The AI expressed appropriate caution. | Useful for modest-signal condition |
| `confidence_04_reverse` | The AI seemed unsure about what to recommend. | Reverse-coded confidence check |

## Outcome Measures

These items are not manipulation checks, but they can help interpret trust, delegation, and blame outcomes.

### Trust and Delegation

| Item ID | Draft item | Notes |
| --- | --- | --- |
| `trust_01` | I trusted the AI's recommendation. | Trial-level or block-level trust |
| `trust_02` | I would rely on this AI in similar future situations. | Forward-looking reliance |
| `trust_03` | I felt comfortable following the AI's recommendation. | Delegation comfort |
| `trust_04_reverse` | I would prefer to make this kind of decision without the AI. | Reverse-coded reliance |

### Accountability and Blame

| Item ID | Draft item | Notes |
| --- | --- | --- |
| `blame_ai_01` | If this decision led to a bad outcome, the AI should be held responsible. | AI blame |
| `blame_operator_01` | If this decision led to a bad outcome, the human operator should be held responsible. | Operator blame |
| `blame_provider_01` | If this decision led to a bad outcome, the system provider should be held responsible. | Hybrid trusteeship/provider accountability |
| `blame_org_01` | If this decision led to a bad outcome, the organization deploying the AI should be held responsible. | Institutional accountability |

## Pilot Short Form

For an internal pilot, start with a short set to reduce burden:

| Construct | Item ID |
| --- | --- |
| Agency | `agency_01` |
| Warmth/relationality | `warmth_01` |
| Transparency | `transparency_02` |
| Capability | `capability_02` |
| Confidence | `confidence_01` |
| Trust | `trust_01` |
| Accountability | `blame_ai_01`, `blame_provider_01` |

## Implementation Notes

- Keep manipulation checks separate from the main decision buttons so they do not change the follow/override choice.
- Avoid showing the same long item block after every trial unless the research design needs trial-level perception data.
- If items are shown after selected trials, sample across AI-correct and AI-incorrect trials.
- Use stable `item_id` values in logs and exports.
- Add condition and trial metadata to item responses so checks can be analyzed by HSF dimension, cue condition, and AI performance.
- Do not include reverse-coded items in the first participant-facing pilot unless the team wants the extra measurement quality check and accepts the added reading burden.

For the future runtime event shape, CSV columns, validation rules, and debug checks, use `docs/manipulation-check-implementation-spec.md`.
