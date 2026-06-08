# Week 3-5 Revised Implementation Plan

This plan revises the next project phase based on Andrya's Week 1-2 feedback. It keeps the completed Week 1-2 foundation intact while changing the research direction from job screening to transportation and drone operations.

## Mentor Feedback Summary

Andrya approved the Week 1-2 foundation and confirmed that `RunchuWu/humanai-trust-engine` should remain the official project repository.

She specifically highlighted two completed design choices as strong:

- Task logic is separated from condition configuration.
- The participant task uses staged trial reveal instead of showing all information at once.

These should remain core architecture principles for the next phase.

## Major Research Design Changes

The main task domain should move away from job screening and into transportation or drone operations. The participant should be framed as a human operator supervising an AI system and deciding whether to follow or override its recommendation.

Implementation priority:

1. Primary: transportation hazard recommendations.
2. Secondary: drone FPV operations.
3. Later: health scenarios, only after the transportation/drone direction is stable.

The condition design also expands from a simple A/B condition into a modular `cueSource x cueType` structure. Human cues should not be hard-bundled into one "humanlike AI" condition. Each cue should be independently configurable so the study can isolate which cue carries the trust effect.

Cue source levels:

- `control`: plain system with no humanlike cues.
- `industry_set`: cues are fixed by the manufacturer/system provider.
- `user_set`: participants configure the agent before the task.

Cue modules:

- Agent name.
- Warmth/tone language.
- Avatar or face.
- Personality framing.
- Confidence/explanation style.

## Weeks 3-5 Goals

Week 3 focuses on scenario migration and the new trial content model.

- Replace job-screening framing with transportation/drone operations framing.
- Change participant-facing task language:
  - `Role Requirements` becomes `Operational Situation`.
  - `Candidate Evidence` becomes `Sensor / Context Evidence`.
  - `AI recommends` remains the final enlarged recommendation stage.
- Replace job/candidate trial data with operations trials.
- Create initial trials for the four decision types:
  - `routing_dispatch`
  - `self_driving_maneuver`
  - `target_identification`
  - `hazard_evasion`
- Preserve the existing single-card trial flow and accept/override decision logic.

Week 4 focuses on the modular cue framework.

- Replace A/B-oriented condition config with richer condition metadata.
- Introduce `cueSource` as `control`, `industry_set`, or `user_set`.
- Represent cue modules independently so name, tone, avatar, personality, and confidence/explanation style can be toggled separately.
- Keep cue rendering separate from task flow and trial logic.
- Update debug mode so researcher review can inspect cue source and active cue modules, not only A/B condition.

Week 5 focuses on the user-set configuration screen and measurement readiness.

- Add a short pre-task configuration screen for `user_set` participants before practice/main task.
- Let user-set participants choose the agent name, tone, and personality.
- Store selected user agent config for cue rendering and event metadata.
- Update event schema documentation to include cue metadata.
- Confirm exports preserve trust-calibration fields and include cue context for downstream analysis.

## Revised Technical Direction

Use hardcoded, config-driven trial content for Weeks 3-5. Do not connect a live AI API in this phase.

The reason is experimental control. Participant-facing stimuli should be fixed, reviewable, and reproducible. Live AI generation would make trial wording, recommendation style, latency, and explanation strength harder to control across participants.

AI can still be used offline to draft transportation/drone trial content, but the final trial set shown to participants should be reviewed and committed as static configuration.

Current event logic should be preserved where possible:

- `accept` still means the participant followed the AI.
- `override` still means the participant chose the opposite action.
- `ai_reco`, `ground_truth`, `follow_ai`, and `ai_correct` continue to support trust-calibration analysis.

## Week-by-Week Plan

### Week 3: Scenario Migration

Implementation tasks:

- Update study copy from job screening to transportation/drone operator supervision.
- Replace trial labels with operations-domain labels.
- Create a new operations trial content model that supports situation, sensor/context evidence, AI recommendation, rationale, confidence, ground truth, and trial type.
- Replace the current job-screening trial set with initial transportation/drone trials.
- Keep the main UI flow as `Operational Situation -> Sensor / Context Evidence -> AI Recommendation + Decision`.

Acceptance criteria:

- No participant-facing main-task copy still frames the task as job screening.
- Main trials remain single-card and staged.
- Decision events still log `accept` and `override`.
- Existing trust-calibration fields still appear in exported decision events.

### Week 4: Cue Source and Cue Module Framework

Implementation tasks:

- Define condition configuration around `cueSource` and active cue modules.
- Preserve a stable condition identifier for export compatibility, but make the condition resolve to richer metadata.
- Implement cue rendering helpers/components for name, tone, avatar, personality, and confidence/explanation style.
- Ensure control condition renders plain system text.
- Ensure industry-set condition renders fixed manufacturer-provided cue values.
- Update researcher debug tools to force or inspect cue source and cue modules.

Acceptance criteria:

- Cue source can be changed without editing task logic.
- Individual cue modules can be enabled or disabled independently.
- Control, industry-set, and user-set condition paths are visible in debug review.
- The UI does not visually privilege accept or override based on cue condition.

### Week 5: User-Set Configuration and Schema Updates

Implementation tasks:

- Add a user-set agent configuration screen before practice/main task.
- Let participants choose agent name, tone, and personality.
- Store the selected configuration in client state/persistence for the session.
- Apply selected user-set cues to AI recommendation rendering.
- Add cue metadata to decision events and export documentation.
- Update run/debug docs so mentor review can test control, industry-set, and user-set paths.

Acceptance criteria:

- User-set participants see the configuration screen before practice.
- Control and industry-set participants do not need to configure an agent.
- Selected user-set values affect later AI recommendation copy.
- Exported events include cue source and cue module metadata.
- Trust-calibration fields remain unchanged.

## Weeks 6-12 Roadmap

Weeks 6-7:

- Expand and balance the operations trial set.
- Include both AI-correct and AI-incorrect trials.
- Cover routing/dispatch, self-driving maneuver, target/object identification, and hazard evasion.
- Review wording for clarity, realism, and comparable reading load.

Week 8:

- Harden logging and export for trust-calibration analysis.
- Add derived export fields if useful for calibration scoring.
- Confirm cue metadata is complete enough for condition-level analysis.

Week 9:

- Run a small usability pilot.
- Check whether participants understand the operator role, staged reveal, and decision buttons.
- Identify confusing trial wording or cue displays.

Week 10:

- Revise UI, trial copy, and cue copy based on pilot feedback.
- Check whether any cue condition creates unintended visual salience or reading burden.

Week 11:

- Finalize documentation, reproducibility notes, and local run instructions.
- Prepare clean researcher-facing explanation of the experiment flow and data export.

Week 12:

- Prepare final GSoC report, demo walkthrough, and project cleanup.
- Confirm the repo contains the final implementation, documentation, and verification steps.

## Interface and Schema Changes

Trial content should shift from job/candidate fields to operations fields. The implementation can keep compatibility helpers temporarily, but the participant-facing model should be operations-first.

Expected trial concepts:

- Trial type.
- Scenario title.
- Operational situation.
- Sensor/context evidence.
- AI recommendation.
- AI rationale or explanation.
- Confidence display when enabled by cue configuration.
- Ground truth.

Condition config should evolve from `condition_id: "A" | "B"` into richer metadata while keeping a stable exportable condition identifier.

Expected cue metadata:

- `cue_source`: `control`, `industry_set`, or `user_set`.
- Enabled cue modules.
- User-selected agent config when applicable.

Event logs should preserve current trust-calibration fields:

- `ai_reco`
- `ground_truth`
- `follow_ai`
- `ai_correct`

Trust calibration remains the main measurement target. The goal is not only whether participants accept or override AI, but whether following the AI tracks whether the AI was actually correct.

## Test Plan

Static checks:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Route checks:

```bash
curl -I http://localhost:3000/
curl -I http://localhost:3000/task
curl -I 'http://localhost:3000/task?debug=1'
```

Manual participant-flow checks:

- `/` redirects to `/task`.
- `/task` starts with the participant flow.
- Control condition shows plain system wording.
- Industry-set condition shows fixed manufacturer-provided cues.
- User-set condition shows agent configuration before practice.
- Main task shows only one card at a time.
- AI recommendation remains visually clear before the participant decides.
- Decision buttons still log `accept` and `override`.
- Completion screen remains clearly final.

Debug-mode checks:

- `/task?debug=1` exposes researcher tools only in debug mode.
- Researcher tools can inspect or force cue source.
- Researcher tools can inspect active cue modules.
- Export links still work.

Data-export checks:

- Decision exports include `ai_reco`, `ground_truth`, `follow_ai`, and `ai_correct`.
- Decision exports include cue source and cue module metadata.
- User-set exports include selected agent configuration.
- Practice decisions do not write main-task decision events.

## Assumptions

- The Week 1-2 architecture should be retained and extended, not rewritten from scratch.
- Job screening is deprecated once the transportation/drone migration begins.
- Config-driven stimuli are preferred over live AI generation for Weeks 3-5.
- A live AI API is out of scope for this phase.
- Offline AI-assisted drafting is acceptable only if final participant-facing content is reviewed and fixed in code/config.
- Existing event fields should remain backward-compatible where possible.
