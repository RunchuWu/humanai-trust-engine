# HSF Cue Definitions Draft

This document defines working HSF cue dimensions for implementation discussion. It is a draft and should be replaced or revised if the research team provides official definitions.

## Status

Current status: draft for research alignment. The app does not yet log these dimensions as explicit runtime fields.

Related implementation mapping:

- `docs/hsf-cue-interface-note.md`
- `docs/hsf-stimulus-design.md`
- `docs/hsf-implementation-handoff.md`

## Dimension Definitions

| HSF dimension | Working definition | Current implementation anchor | Current limitation |
| --- | --- | --- | --- |
| Appearance | Visual or embodied humanlikeness in how the AI is presented | Avatar initials badge and visible agent identity | No face, embodiment level, or explicit appearance metadata |
| Communication | Linguistic style, explanation, transparency, uncertainty, and confidence language | Neutral vs warm rationale, first-person wording, confidence line | Confidence and explanation are bundled; transparency level is not explicit |
| Behavior | Demonstrated task capability and performance quality | `ai_reco`, `ground_truth`, `ai_correct`, rationale quality | Performance condition is not explicitly exported as HSF metadata |
| Relationality | Social-emotional orientation, warmth, supportiveness, personalization, or continuity | Warm tone, supportive personality label, user-set configuration | No memory/continuity and no approved relationality intensity level |
| Agency | Perceived autonomy, intentionality, or active decision role of the AI | Named agent framing, first-person recommendation language | No approved high/low agency wording rules or exported agency level |

## Current Cue Modules

| Cue module | Current participant-facing cue | HSF dimensions it may affect |
| --- | --- | --- |
| `agent_name` | Named agent lead such as `Atlas recommends` | Agency, Communication |
| `tone_warmth` | Warm first-person rationale | Communication, Relationality |
| `avatar` | Agent initials badge | Appearance |
| `personality` | Label such as `Calm risk monitor` or `Supportive operator assistant` | Relationality, Agency |
| `confidence_explanation` | Confidence percentage and rationale display | Communication, Behavior |
| AI correctness | Correct or incorrect AI recommendation | Behavior |

## Draft Level Rules

These rules are not final experimental conditions. They are implementation-friendly starting points for review.

| Dimension | Low or absent cue | High cue |
| --- | --- | --- |
| Appearance | Generic AI label; no avatar; no visual agent identity | Avatar or face; named visual identity; consistent agent presentation |
| Communication | Neutral system rationale; minimal uncertainty language | Warm, transparent, or confidence-marked explanation, depending on approved factor |
| Behavior | AI performance unsupported by outcome or weak rationale quality | AI performance supported by outcome and coherent rationale |
| Relationality | Neutral functional wording | Warmth, support, personalization, or continuity |
| Agency | Passive system recommendation wording | Named agent, first-person recommendation, or active decision-partner framing |

## Manipulation Check Links

Draft manipulation-check items are in `docs/hsf-manipulation-checks.md`.

Suggested construct mapping:

| Dimension | Manipulation-check construct |
| --- | --- |
| Appearance | Add only if visual humanlikeness becomes an active manipulation |
| Communication | Transparency and confidence |
| Behavior | Capability |
| Relationality | Warmth |
| Agency | Agency/autonomy |

## Open Definition Questions

- Should confidence be part of communication, behavior, or a separate signal-strength factor?
- Should behavior refer only to objective correctness, or also rationale quality and error handling?
- Should relationality include only warmth/supportiveness in this phase?
- Should agency be manipulated through wording only, visual identity only, or both?
- Should appearance remain an initials/avatar cue or use a stronger embodied cue?
- Should participant customization in `user_set` be retained or paused for cleaner HSF manipulation?
