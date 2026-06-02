# Week 1-2 Implementation Plan

This plan follows the proposal milestone:

> Rebuild experiment shell with deliberate screen sequencing; implement participant ID assignment and randomized condition assignment.

Milestone outcome: a navigable participant flow with stable assignment logic and researcher debug tools for review.

## Week 1: Experiment Shell and Assignment

1. Define explicit screen sequencing:
   - `welcome`
   - `consent`
   - `instructions`
   - `comprehension_check`
   - `practice_trial`
   - `main_task`
   - `debrief`

2. Move flow configuration out of the page component:
   - `SCREEN_SEQUENCE`
   - `PRACTICE_TRIAL`
   - `CONDITION_CUES`
   - recommendation display helpers

3. Keep the participant-facing task logic separated from assignment logic:
   - assignment generation stays in `src/lib/conditions.ts`
   - task screen sequencing stays in `src/app/task/page.tsx`
   - condition cue values stay in `src/lib/experiment-config.ts`

4. Harden assignment behavior:
   - persistent `participantId`
   - persistent randomized `conditionId`
   - page-entry `sessionId`
   - debug-only condition forcing for A/B review

5. Remove stale assignment code:
   - retire duplicate participant-context logic so there is one assignment source of truth.

## Week 2: Participant Flow and Researcher Review

1. Make screen-by-screen information architecture deliberate:
   - welcome and consent are separate
   - instructions are separate from the comprehension check
   - practice trial appears before the main task
   - debrief appears after all main trials

2. Reduce trial-screen cognitive load:
   - reveal role requirements first
   - reveal candidate summary second
   - reveal the AI recommendation last

3. Make the AI recommendation visually dominant:
   - use a large recommendation label
   - keep rationale near the recommendation
   - make Accept/Override explicitly about the AI recommendation

4. Preserve decision neutrality:
   - Accept and Override controls use equal visual weight
   - button labels clarify whether the participant is following or overriding the AI

5. Add researcher debug affordances:
   - reset assignment
   - force condition A or B
   - jump to any screen
   - export JSON/CSV

## Acceptance Criteria

- `/task` starts with a clean participant sequence, not the trial directly.
- A participant cannot reach the main task without consent, instructions, comprehension check, and practice.
- Main task logging only fires in `main_task`.
- Practice decisions do not write main-task decision events.
- AI recommendation is visually clear before Accept/Override appears.
- Debug mode at `/task?debug=1` exposes assignment, screen, trial index, export tools, condition forcing, and screen jumps.
- `npm run lint` passes.
- `npx tsc --noEmit` passes.
- `GET /task?debug=1` returns a valid page in local development.
