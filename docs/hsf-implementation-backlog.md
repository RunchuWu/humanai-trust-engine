# HSF Implementation Backlog

This backlog decomposes the Week 9 HSF runtime work into implementation tasks. Do not start these tasks until the research decisions in `docs/research-decision-tracker.md` are confirmed.

## Dependency Gate

Required confirmed decisions before implementation:

- RD-01 participant-facing format
- RD-02 priority HSF dimensions
- RD-03 condition structure
- RD-06 confidence role
- RD-07 manipulation-check placement, if manipulation checks enter runtime
- RD-08 user-set condition role
- RD-10 final pilot scope

## Backlog

| Task ID | Task | Files | Depends on | Acceptance evidence |
| --- | --- | --- | --- | --- |
| HSF-01 | Add shared HSF runtime types | new shared HSF types module or existing lib files | RD-02, RD-03, RD-06 | TypeScript exports approved dimension, level, confidence, and performance types |
| HSF-02 | Extend condition config with approved HSF metadata | `src/lib/cue-config.ts` | HSF-01, RD-03, RD-08 | Every active condition has approved `hsfCueConditionId` and dimension metadata |
| HSF-03 | Extend trial data with performance and signal metadata | `src/lib/trials.ts` | HSF-01, RD-06, RD-10 | Every main trial carries approved performance and confidence-signal fields |
| HSF-04 | Add HSF metadata to decision event payloads | `src/app/task/page.tsx` | HSF-02, HSF-03 | New decision events include approved HSF fields while preserving trust-calibration fields |
| HSF-05 | Extend event validation | `src/lib/schema.ts` | HSF-04 | Invalid HSF metadata is rejected; legacy rows remain readable if required |
| HSF-06 | Extend CSV export columns | `src/lib/event-store.ts` | HSF-05 | CSV includes approved HSF fields and existing fields remain unchanged |
| HSF-07 | Show HSF metadata in debug mode | `src/app/task/components/DebugPanel.tsx`, `src/app/task/page.tsx` | HSF-02, HSF-03 | Debug panel shows HSF condition, dimensions, confidence signal, performance condition, and trial correctness |
| HSF-08 | Implement manipulation-check UI, if approved | `src/app/task/page.tsx`, possible new component | RD-07, HSF-01 | Approved item set appears at approved placement without changing decision button behavior |
| HSF-09 | Add manipulation-check event logging, if approved | `src/lib/schema.ts`, `src/app/task/page.tsx`, `src/lib/event-store.ts` | HSF-08 | Check responses export with item ID, construct, response value, scale, participant, condition, and trial context |
| HSF-10 | Update documentation after implementation | `docs/event-schema.md`, `docs/how-to-run.md`, `docs/operations-trial-stimuli.md`, `docs/condition-logic.md` | HSF-01 through HSF-09 as applicable | Docs describe actual exported fields and debug behavior |
| HSF-11 | Run verification and pilot smoke test | docs plus app runtime | HSF-10 | `npm run lint`, `npx tsc --noEmit`, `npm run build`, and researcher walkthrough pass |

## Per-Task Notes

### HSF-01: Shared Types

Preferred approach:

- Add a new shared HSF types module if HSF types are used by conditions, trials, schema, and UI.
- Keep naming aligned with approved research terms.
- Avoid hardcoding unapproved level names in multiple files.

### HSF-02: Condition Metadata

Potential fields:

- `hsfCueConditionId`
- `hsfDimensions`
- `appearanceLevel`
- `communicationLevel`
- `relationalityLevel`
- `agencyLevel`

Implementation caution:

- Preserve current `condition_id` values unless migration is explicitly approved.

### HSF-03: Trial Metadata

Potential fields:

- `performanceCondition`
- `confidenceSignalLevel`
- `behaviorSignal`
- `manipulationCheckItemIds`

Implementation caution:

- Do not infer final confidence levels from current numeric confidence values without research approval.

### HSF-04: Decision Event Payload

Required preservation:

- `ai_reco`
- `ground_truth`
- `follow_ai`
- `ai_correct`
- `cue_source`
- `cue_modules`

Add only approved HSF fields.

### HSF-05: Event Validation

Validation should:

- accept only approved HSF enum values
- preserve existing validation of `follow_ai` and `ai_correct`
- keep legacy `A`/`B` handling only if still needed for old exports

### HSF-06: CSV Export

CSV should:

- keep stable existing columns
- append approved HSF columns
- serialize arrays such as dimensions in a consistent delimiter format

### HSF-07: Debug Display

Debug mode should show HSF metadata without changing participant mode.

Recommended debug-only fields:

- HSF cue condition ID
- HSF dimensions
- confidence-signal level
- performance condition
- `ai_correct`
- ground truth

### HSF-08 and HSF-09: Manipulation Checks

Only implement after placement and item wording are approved.

Recommended starting path:

- End-of-task short-form checks for internal pilot.
- Add trial-level checks later only if needed.

## Verification Commands

Run after implementation:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Manual verification:

1. Open `/task?debug=1`.
2. Force each approved condition.
3. Complete at least two trials, including one AI-correct and one AI-incorrect trial.
4. Export JSON and CSV.
5. Confirm existing trust-calibration fields and approved HSF fields appear together.
6. If manipulation checks are implemented, submit and export one check response.
