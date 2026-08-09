# HSF Cue-to-Interface Alignment Note

This note maps the current HumanAI Trust Calibration Engine cue system to the HSF dimensions listed in the Week 7-12 plan. It is intended for research-team review before implementation changes are made.

## Review Scope

Reviewed in this repository:

- `docs/week-7-12-plan.md`
- `docs/week-3-5-plan.md`
- `docs/operations-trial-stimuli.md`
- `src/lib/cue-config.ts`
- `src/lib/trials.ts`
- `src/lib/schema.ts`
- `src/app/task/page.tsx`
- `src/app/task/components/DebugPanel.tsx`

Not found in the repository:

- HSF manuscript
- experimental-design note
- recentered method draft

The mapping below should therefore be treated as an implementation-facing draft. The research team's definitions should override this note where they differ.

## Current Cue Inventory

| Current cue module | Participant-facing representation | Current data or UI support | Likely HSF dimension |
| --- | --- | --- | --- |
| `agent_name` | Named agent lead, for example `Atlas recommends` | `ConditionConfig.agent.name`, user-set name options, `agent_name` export field | Agency, Communication |
| `tone_warmth` | Warm first-person rationale instead of neutral system rationale | `rationale_control`, `rationale_warm`, `agent_tone` export field | Communication, Relationality |
| `avatar` | Initials badge beside the recommendation | `agent.avatarLabel`, `agent_avatar_label` export field | Appearance |
| `personality` | Label such as `Calm risk monitor` or `Supportive operator assistant` | `agent.personality`, user-set personality options, `agent_personality` export field | Relationality, Agency |
| `confidence_explanation` | Confidence percentage plus rationale | `trial.confidence`, confidence display when cue is active | Communication, Behavior |
| AI recommendation correctness | Correct or incorrect AI recommendation per trial | `ai_reco`, `ground_truth`, `ai_correct` | Behavior |

## HSF Dimension Mapping

| HSF dimension | Current implementation | Already supported | Gaps before HSF-aligned implementation |
| --- | --- | --- | --- |
| Appearance | Initials avatar badge and visible agent identity | Partial | No face, embodiment level, visual humanlikeness level, or explicit appearance condition metadata |
| Communication | Neutral vs warm rationale, first-person wording, confidence line | Partial | No explicit transparency level, no standardized communication-style condition label, and confidence is bundled with explanation |
| Behavior | AI recommendation quality through `ai_correct`; rationale quality through fixed text | Partial | No explicit performance-condition field such as `ai_correct_high_signal`, no difficulty labels, and no rationale-quality manipulation metadata |
| Relationality | Warm tone, supportive personality label, user-set configuration | Partial | No memory, continuity, personalization beyond selected agent settings, or relationality intensity field |
| Agency | Named agent framing, agent labels, first-person recommendation language | Partial | No direct high-agency vs low-agency condition, no autonomy/action-framing field, and no manipulation-check linkage |

## Existing vs Needed Fields

The current schema is enough for trust-calibration basics:

- `condition_id`
- `cue_source`
- `cue_modules`
- `ai_reco`
- `ground_truth`
- `follow_ai`
- `ai_correct`
- `agent_name`
- `agent_tone`
- `agent_personality`
- `agent_avatar_label`

HSF-aligned analysis would benefit from adding explicit metadata instead of inferring dimensions from cue modules:

| Proposed field | Level | Purpose |
| --- | --- | --- |
| `cue_condition_id` | condition or trial | Stable label for the HSF cue condition under review |
| `hsf_dimensions` | condition or trial | Array of represented HSF dimensions, for example `["agency", "communication"]` |
| `appearance_level` | condition | Low, medium, or high visual humanlikeness |
| `communication_style` | condition | Neutral, warm, transparent, confident, modest, or another approved label |
| `behavior_performance_condition` | trial | AI-correct vs AI-incorrect, optionally crossed with high or low signal |
| `relationality_level` | condition | None, low, or high social-emotional orientation |
| `agency_level` | condition | Low or high autonomy and intentionality framing |
| `confidence_signal_level` | trial or condition | Modest vs confident signal independent of actual correctness |
| `manipulation_check_items` | trial or block | Items tied to perceived agency, warmth, capability, transparency, and confidence |

## Implementation Implications

Do not replace the current condition system until Andrya confirms the participant-facing format and target HSF dimensions. The current architecture already separates task flow, trial content, cue configuration, and event export, so the next implementation step can be incremental:

1. Keep fixed, reviewable participant-facing stimuli unless the research design changes.
2. Add HSF metadata to cue and trial configuration after cue definitions are confirmed.
3. Preserve existing trust-calibration fields so prior analysis remains compatible.
4. Extend debug mode to show HSF dimensions and trial performance metadata.
5. Add export fields only after names and levels are approved by the research team.

## Research-Team Review Questions

The main decisions to resolve before code changes:

- Which HSF dimensions are required in the immediate experiment?
- Should cue modules continue to be toggled independently, or should the next phase use named HSF cue conditions?
- Should confidence be treated as a communication cue, behavior cue, or separate signal-strength factor?
- Should agency be manipulated through wording only, or through both wording and visual agent identity?
- Should relationality include only warmth/supportiveness, or also continuity and personalization?
- Which manipulation-check items should be tied to each dimension?
