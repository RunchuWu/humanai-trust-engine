# Week 7-12 Research Alignment and Implementation Plan

This plan reflects the midterm direction from the HSF manuscript materials and the follow-up discussion about cue definitions, experiment format, and OpenAI API scope.

The working assumption for this phase is:

> Continue with a controlled decision-based experiment using fixed, reviewable stimuli unless Andrea confirms that the participant-facing study should become an interactive AI collaboration experience.

Fixed stimuli means controlled experimental materials, not low-quality placeholder data. The goal is to manipulate HSF cue dimensions and AI performance conditions cleanly enough that participant trust, delegation, and blame outcomes can be interpreted.

## Research Direction From the HSF Materials

The attached HSF materials shift the next phase from a generic humanlike-agent interface toward a theory-aligned experiment platform. The system should support cue manipulations connected to:

- Hybrid trusteeship: participants may experience the AI system as the immediate trustee while holding the firm or system provider accountable.
- Calibration threshold: humanlike signaling should increase trust only when demonstrated capability supports the signal; over-signaling should create a trust penalty.
- Market Humanlikeness Architecture: humanlike cues should be represented as separable design dimensions rather than one bundled "humanlike AI" condition.

## Immediate Questions for Andrea

These questions should be clarified before major implementation changes:

1. Cue representation:
   - Which HSF cue dimensions should be prioritized in the interface first?
   - Should the current phase support all five dimensions, or focus on the dimensions most central to the immediate experiment?
   - Does the research team already have preferred examples or definitions for each cue?

2. Participant-facing format:
   - Should the next version remain a controlled decision-based experiment with fixed AI recommendations?
   - Should it become a survey/vignette-style evaluation?
   - Or should it move toward an interactive AI collaboration experience?

3. Dataset and stimulus development:
   - Should AI recommendations be written manually, drafted with AI and then reviewed, or generated through another process?
   - If AI-assisted stimuli are acceptable, what counts as an approved stimulus?
   - Who should review the final stimuli for cue clarity, comparability, and research-design alignment?

4. OpenAI API scope:
   - Is a live API needed for participant-facing sessions, or should API support be treated as a future researcher-facing stimulus generation tool?
   - If an API is used later, should it generate candidate stimuli offline or power real-time participant interaction?

## OpenAI API Position

Do not prioritize a live participant-facing OpenAI API integration until the experiment format is confirmed.

For a controlled decision-based experiment, hard-coded stimuli are stronger because they preserve:

- reproducibility across participants
- direct comparison across conditions
- controlled cue intensity
- stable wording and reading load
- stable AI performance outcomes
- cleaner interpretation of trust and blame measures

A constrained API integration may become useful if the study becomes interactive. In that case, the implementation should use structured prompts, low-temperature settings, output logging, and post-hoc checks so cue conditions remain analyzable.

A middle path is a researcher-facing stimulus drafting tool: the API generates candidate AI recommendations across cue conditions, researchers review the outputs, and approved outputs are saved as static stimuli for the actual participant-facing experiment.

## HSF Cue Mapping Draft

Current cue modules should be mapped to the five HSF dimensions as follows:

| HSF dimension | Interface representation | Current or likely implementation |
| --- | --- | --- |
| Appearance | Visual or embodied humanlikeness | avatar, face/label, agent visual identity |
| Communication | Linguistic style and transparency | tone, first-person wording, confidence language, disclosure of limits |
| Behavior | Demonstrated task capability | AI recommendation quality, correct/incorrect outcome, rationale quality, error handling |
| Relationality | Social-emotional orientation | warmth, personalization, supportive language, memory/continuity if used |
| Agency | Perceived autonomy and intentionality | named agent framing, "I will handle this" language, autonomous decision/action framing |

This mapping should be treated as the first draft. The research team's cue definitions should override or refine it.

## Week 7: Research Alignment and Cue Mapping

Primary goal: make the next phase legible before changing the implementation surface too much.

Tasks:

1. Review the HSF manuscript, experimental-design note, and recentered method draft.
2. Map the current cue modules to HSF dimensions.
3. Identify which cues already exist in the interface and which would require new UI or trial-data fields.
4. Send Andrea the alignment questions above.
5. Draft a short cue-to-interface note that can be reviewed by the research team.

Deliverables:

- `docs/week-7-12-plan.md`
- draft cue mapping table
- alignment email to Andrea

Acceptance criteria:

- The project has a documented Week 7-12 plan.
- The plan distinguishes controlled fixed stimuli from interactive AI collaboration.
- OpenAI API scope is framed as a research-design decision, not an implementation default.

## Week 8: Dataset and Stimulus Design

Primary goal: define how the controlled stimuli should be built if the project remains decision-based.

Tasks:

1. Confirm the target participant-facing format after Andrea's feedback.
2. Draft the stimulus data model for HSF-aligned trials.
3. Specify required fields for each trial:
   - scenario title
   - operational situation
   - sensor/context evidence
   - AI recommendation
   - AI rationale
   - signal or confidence level
   - performance outcome or ground truth
   - cue condition
   - HSF cue dimensions represented
   - trust/blame/manipulation-check items where applicable
4. Create an initial stimulus matrix for the lead HSF tests:
   - high agency / low agency
   - confident signal / modest signal
   - success / failure or AI-correct / AI-incorrect
   - high humanlike / low humanlike presentation where relevant
5. Define a review checklist for approved stimuli:
   - cue manipulation is clear
   - non-target wording is comparable
   - scenario difficulty is reasonable
   - recommendation length and information load are comparable
   - performance outcome is unambiguous
   - no condition unintentionally advantages follow or override

Deliverables:

- dataset/stimulus design note
- initial HSF stimulus matrix
- stimulus approval checklist

Acceptance criteria:

- The team can review how each stimulus maps to cue dimensions and performance conditions.
- The stimulus process supports either manually written or AI-assisted drafts.
- The plan avoids live-generation variability during participant sessions unless the research design changes.

## Week 9: Implementation of Confirmed Cue Structure

Primary goal: update the app only after the research format and stimulus approach are clear.

Tasks:

1. Update cue configuration to represent the confirmed HSF dimensions.
2. Update trial data types to carry cue condition and performance metadata.
3. Update participant-facing UI copy so the active cue condition is visible in the intended way.
4. Update decision logging so exports include the confirmed cue metadata.
5. Keep debug mode able to inspect participant assignment, cue source, active cue modules, and trial metadata.

Deliverables:

- HSF-aligned cue configuration
- updated trial schema
- updated export fields and documentation

Acceptance criteria:

- Participant-facing cue displays match the approved cue mapping.
- Decision events preserve trust-calibration fields and add HSF cue metadata.
- Debug mode can inspect active cue dimensions without changing participant mode.

## Week 10: Pilot Readiness

Primary goal: prepare a version that can be tested internally before broader review.

Tasks:

1. Expand and balance operations/drone trials.
2. Ensure the trial set includes both AI-correct and AI-incorrect recommendations.
3. Add or prepare manipulation-check items for perceived:
   - autonomy/agency
   - warmth/relationality
   - transparency
   - capability
   - confidence
4. Check whether cue conditions introduce unintended visual salience or reading burden.
5. Run through the full participant flow in participant mode and debug mode.

Deliverables:

- pilot-ready controlled stimulus set
- manipulation-check draft
- internal pilot notes

Acceptance criteria:

- The role, recommendation format, and decision actions are understandable.
- Cue manipulations are visible but not confounded with button salience or UI weight.
- Trial wording is clear enough for a small internal pilot.

## Week 11: Pilot Revision and Documentation

Primary goal: revise based on pilot review and make the project reproducible.

Tasks:

1. Revise cue wording, trial copy, and UI details based on pilot feedback.
2. Confirm exports contain the fields needed for condition-level analysis.
3. Update documentation:
   - how to run
   - condition logic
   - event schema
   - stimulus schema
   - cue definitions
4. Prepare a researcher-facing walkthrough of the participant flow and export workflow.

Deliverables:

- revised pilot build
- updated docs
- researcher walkthrough notes

Acceptance criteria:

- A researcher can run the task locally, force conditions, complete a session, and export decision data.
- Documentation explains how HSF cue dimensions are represented in the implementation.

## Week 12: Final GSoC Report and Demo

Primary goal: package the project outcome clearly for final review.

Tasks:

1. Finalize the implementation and remove stale experimental wording where appropriate.
2. Run verification:
   - `npm run lint`
   - `npx tsc --noEmit`
   - `npm run build` where the environment supports it
3. Prepare final report:
   - completed milestones
   - HSF alignment
   - experiment format decision
   - cue/dataset design
   - logging and export support
   - future OpenAI API path
4. Prepare final demo walkthrough.

Deliverables:

- final repo state
- final report
- demo walkthrough

Acceptance criteria:

- The project clearly supports a controlled HSF cue-manipulation experiment.
- Remaining open questions are documented as future research decisions, not hidden implementation gaps.
- The OpenAI API path is scoped without compromising controlled participant-facing stimuli.

## Long-Term Path After GSoC

If the research program continues after the current project window, the recommended sequence is:

1. Run controlled decision-based pilot with fixed stimuli.
2. Analyze whether cue manipulations are perceived as intended.
3. Revise stimuli and manipulation checks.
4. Add a researcher-facing API-assisted stimulus drafting tool if useful.
5. Only consider participant-facing live API interaction if the research question shifts from controlled cue effects to real-time AI collaboration.
