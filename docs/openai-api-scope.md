# OpenAI API Scope

This document defines the OpenAI API scope for the Week 7-12 HSF phase.

## Current Position

Do not implement a live participant-facing OpenAI API path unless Andrea confirms that the study should become an interactive AI collaboration experience.

For the current controlled decision-based experiment, participant-facing stimuli should remain fixed, reviewed, and committed to the repository before use.

## Why Live Generation Is Not the Default

Live participant-facing generation would make these variables harder to control:

- recommendation wording
- cue intensity
- explanation length
- reading load
- confidence signal
- latency
- AI correctness
- comparability across participants
- interpretation of trust, delegation, and blame outcomes

The controlled HSF design needs stable stimuli so cue effects can be analyzed rather than confounded with generation variability.

## Approved Near-Term Scope

API work may be considered later as a researcher-facing drafting aid, not as participant-facing runtime behavior.

Recommended researcher-facing workflow:

1. Researcher selects scenario constraints and target cue condition.
2. API drafts candidate recommendation text and rationale variants.
3. Researcher reviews, edits, or rejects the draft.
4. Approved text is saved as static trial configuration.
5. Participant-facing sessions use only the approved static stimuli.

## Candidate Researcher-Facing Tool Requirements

If a drafting tool is built later, it should:

- run outside participant sessions
- log prompt inputs and generated candidates
- support target HSF dimensions and cue levels
- separate AI recommendation, rationale, confidence signal, and performance condition
- flag output length and reading-load differences
- require explicit researcher approval before any text enters `src/lib/trials.ts`
- preserve a review trail for final stimuli

## Prompting Constraints for a Future Drafting Tool

Use structured prompts that specify:

- scenario title
- operational situation
- sensor/context evidence
- intended ground truth
- intended AI recommendation
- intended AI correctness
- target HSF cue dimension
- target cue level
- target confidence-signal level
- approximate rationale length
- banned additions or unsupported facts

Use deterministic or low-variability settings where available, and treat generated output as draft text only.

## Participant-Facing API Exception

A live participant-facing API should only be considered if the research question changes from controlled cue effects to real-time AI collaboration.

If that happens, the implementation must add:

- structured prompts
- constrained output schemas
- output logging
- session-level response traceability
- latency logging
- post-hoc cue-condition checks
- safeguards against unreviewed cue drift
- analysis plans that account for generated variability

## Current Implementation Status

No participant-facing OpenAI API is implemented in the current app.

This is intentional for the controlled fixed-stimulus path.

Related docs:

- `docs/week-7-12-plan.md`
- `docs/research-decision-tracker.md`
- `docs/hsf-stimulus-design.md`
- `docs/hsf-implementation-handoff.md`
