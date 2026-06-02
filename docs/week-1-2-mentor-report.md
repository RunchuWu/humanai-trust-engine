# Week 1-2 Mentor Report

Subject: Week 1-2 update: participant flow, assignment logic, and debug tooling

Hi [Mentor Name],

This week I focused on completing the Week 1-2 milestone from my proposal: rebuilding the experiment shell with deliberate screen sequencing, implementing stable participant/condition assignment, and improving the participant-facing task flow so it is clearer and easier to review.

## Summary

The project is now beyond the initial screening MVP and is structured as the official GSoC project foundation. I updated the experiment flow from a simple instruction gate plus trial screen into a deliberate participant sequence:

1. Welcome
2. Consent
3. Instructions
4. Comprehension check
5. Practice trial
6. Main task
7. Debrief

The main participant-facing improvement is that trial information is no longer shown all at once. Each trial now reveals information in stages: first the role requirements, then the candidate summary, then the AI recommendation. The AI recommendation is visually larger and appears as the final focal point before the participant decides whether to follow or override it.

## What I Completed

### Experiment Shell

- Added an explicit screen-state flow for the study.
- Added a practice trial before the main 10-trial task.
- Added a comprehension check before participants can start the practice/main task sequence.
- Ensured main-task logging only starts once the participant is actually in `main_task`.

### Participant UI

- Reworked the trial UI to reduce information overload.
- Changed the trial reveal order to guide participants through the decision context.
- Enlarged the AI recommendation so the participant can clearly identify what the AI chose.
- Updated decision buttons to say `Accept AI Recommendation` and `Override AI Recommendation`.
- Made Accept and Override visually equal-weight to avoid introducing a visual bias.

### Assignment and Debug Tooling

- Centralized participant and condition assignment logic in `src/lib/conditions.ts`.
- Removed stale duplicate participant assignment code.
- Added debug controls to force condition A or B for review.
- Added debug screen-jump controls so we can inspect each participant screen without repeatedly completing the whole task.
- Kept researcher controls hidden unless `?debug=1` is present.

### Documentation

- Updated the README so the repo is framed as the official GSoC project, not just a screening MVP.
- Added `docs/week-1-2-plan.md` with the implementation plan and acceptance criteria.
- Added `docs/how-to-run.md` with local run and debug instructions.
- Added `docs/event-schema.md` documenting the current logging/export schema.

## Verification

I verified the current implementation with:

```bash
npm run lint
npx tsc --noEmit
npm run build
curl -I http://localhost:3000/task
curl -I 'http://localhost:3000/task?debug=1'
```

All checks passed after wrapping the task page's `useSearchParams()` usage in a `Suspense` boundary to satisfy Next.js production-build requirements.

## Current Status

The Week 1-2 milestone is complete. The app now has a navigable participant flow, stable assignment logic, clearer trial information architecture, and debug tools that should make mentor review much easier.

The local branch contains a sequence of implementation commits covering:

- explicit experiment screen flow
- staged AI recommendation UI
- centralized experiment configuration
- hardened assignment/debug controls
- debug screen navigation
- Week 1-2 documentation
- production build fix

## Next Steps

For Weeks 3-5, I plan to focus on the configuration-driven cue manipulation framework:

- expand condition configuration for agent name, tone, and confidence framing
- make cue rendering more modular and less hardcoded
- keep task logic independent from condition configuration
- prepare UI neutrality checks so the manipulated cue dimensions are isolated from layout or button styling effects

Best,

Runchu
