# Participant-Facing Format Options

This document supports RD-01 in `docs/research-decision-tracker.md`: deciding whether the next participant-facing version should remain a controlled decision-based task, become a survey/vignette evaluation, or shift toward interactive AI collaboration.

## Recommendation

Keep the next version as a controlled decision-based task with fixed, reviewable stimuli unless Andrya confirms that the research question is specifically about real-time AI collaboration.

## Option Comparison

| Option | Description | Strengths | Risks | Implementation impact |
| --- | --- | --- | --- | --- |
| Controlled decision task | Participant reviews staged operational evidence, sees a fixed AI recommendation, and chooses follow or override | Strong experimental control; supports trust calibration; preserves fixed cue/performance comparisons | Less interactive realism | Add HSF metadata, debug display, export fields, and possibly manipulation checks |
| Survey/vignette evaluation | Participant reads static scenarios and rates perceptions or judgments | Fast to deploy; easier manipulation checks; lower interaction complexity | Weaker behavioral follow/override measure; less like operational supervision | Rework participant flow around rating pages and item blocks |
| Interactive AI collaboration | Participant interacts with an AI system in real time | Highest ecological realism if studying collaboration | Harder control; generated variability; cue drift; more complex logging and analysis | Requires API architecture, structured prompts, output schemas, full transcript logging, and latency/cue checks |

## Controlled Decision Task

Use this path if the priority is:

- trust calibration
- follow versus override behavior
- controlled cue manipulation
- AI-correct versus AI-incorrect comparisons
- stable wording and reading load
- reproducible participant sessions

Current app fit:

- Already implemented as the current `/task` flow.
- Current trials are fixed and reviewable.
- Current logs already preserve `ai_reco`, `ground_truth`, `follow_ai`, and `ai_correct`.
- Week 9 implementation can add explicit HSF metadata without redesigning the full participant flow.

Needed next work:

- Confirm priority HSF dimensions.
- Confirm condition structure.
- Add HSF cue/trial metadata.
- Add debug/export fields.
- Add approved manipulation checks if needed.

## Survey or Vignette Evaluation

Use this path if the priority is:

- perceived agency, warmth, transparency, capability, confidence, or blame ratings
- quick review of cue perception
- low burden and simple session flow
- vignette-level comparison without behavioral decision timing

Tradeoffs:

- Follow/override behavior becomes less central or disappears.
- Existing staged trial flow may be simplified or replaced.
- Event schema would need rating-response events rather than only `decision` events.
- Trust calibration based on actual AI correctness becomes less direct unless vignettes still include performance outcomes.

Needed next work:

- Define rating items and scales.
- Decide whether each vignette includes a follow/override choice.
- Add rating-response schema and export fields.
- Update participant instructions and debrief.

## Interactive AI Collaboration

Use this path only if the research question shifts toward:

- live collaboration with AI
- dynamic human-AI interaction
- adaptation, negotiation, or dialogue
- real-time system behavior rather than fixed cue effects

Tradeoffs:

- Stronger realism.
- Much weaker control over wording, latency, confidence, and cue intensity.
- More difficult to compare conditions.
- Requires a larger logging and analysis plan.

Needed next work:

- Define interaction protocol.
- Define API prompts and output schemas.
- Log full interaction traces.
- Add cue-drift checks.
- Add latency and model-response metadata.
- Rework analysis plan around generated variability.

See `docs/openai-api-scope.md` before choosing this path.

## Decision Rule

Choose controlled decision task if:

- the main question is how HSF cues affect trust calibration, delegation, and blame under controlled AI performance;
- participant-facing stimuli must be comparable across conditions;
- the team wants a pilot-ready version with minimal architecture risk.

Choose survey/vignette if:

- the main question is cue perception rather than operational decision behavior;
- manipulation checks are more important than follow/override choices;
- the team wants a lighter evaluation before implementation.

Choose interactive AI collaboration if:

- the main question is about real-time collaboration rather than fixed cue effects;
- the team accepts generated variability as part of the research design;
- the team is ready to define a larger API logging and analysis protocol.

## Current Recommendation for Week 9

Proceed with the controlled decision task path after Andrya confirms RD-01. This keeps the current implementation surface stable and focuses Week 9 on HSF metadata, debug visibility, export fields, and approved manipulation checks.
