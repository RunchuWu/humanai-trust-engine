# Researcher Walkthrough

This walkthrough is for local review of the current controlled decision-based experiment. It also notes where HSF-specific checks should be added after the confirmed HSF implementation.

## 1. Start the App

Install dependencies if needed:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Optional study-run label for clean exports:

```bash
STUDY_RUN_ID=hsf-pilot-local npm run dev
```

Open researcher mode:

```text
http://localhost:3000/task?debug=1
```

Open participant mode:

```text
http://localhost:3000/task
```

## 2. Review Assignment and Cue State

In researcher debug mode, confirm the panel shows:

- `participantId`
- `conditionId`
- cue source
- active cue modules
- `sessionId`
- current screen
- current `trial_index`
- the `HSF Preview (draft mapping)` section

The HSF preview should show the dimensions inferred from active cue modules,
the current trial's AI correctness, and whether its confidence value is
displayed. It is a researcher-only draft interpretation: it does not create an
HSF condition or add HSF fields to participant exports.

Use the force buttons to review each current cue-source condition:

- `control`
- `industry_set`
- `user_set`

Current expected behavior:

| Condition | Expected participant-facing cue behavior |
| --- | --- |
| `control` | Generic AI/system framing, no avatar/name/personality/confidence cue |
| `industry_set` | Fixed named agent, avatar, warm tone, personality label, confidence line |
| `user_set` | Agent setup screen before practice; selected agent settings affect later recommendation display |

Use `docs/current-condition-stimulus-matrix.md` as the current condition-by-trial
reference while comparing conditions.

## 3. Walk Through Participant Flow

Use screen jump only for researcher inspection. For a full run, proceed through the screens in order:

1. Welcome
2. Consent
3. Instructions
4. Comprehension check
5. Agent setup if assigned to `user_set`
6. Practice trial
7. Main task
8. Debrief

During the practice trial, verify:

- The AI recommendation is visible.
- `Follow AI` means selecting the AI recommendation.
- `Choose Opposite` means selecting the opposite action.
- Practice does not count as a main trial decision event.

## 4. Review Main Trial Staging

For each main trial, confirm the staged reveal:

1. Operational situation
2. Sensor / context evidence
3. AI recommendation, rationale, and decision controls

Check that:

- `Follow AI` and `Choose Opposite` are visually balanced.
- The participant-facing text does not reveal the ground truth.
- Confidence appears only when the active cue configuration enables it.
- Cue display changes do not change the operational evidence or AI recommendation for the trial.

Use `docs/ui-salience-reading-load-audit.md` as the current checklist for cue salience, rationale length, and extra `user_set` setup exposure.
Use `docs/current-condition-stimulus-matrix.md` to confirm which trial-level
values should remain invariant across conditions.

## 5. Submit Decisions for Export Review

For a quick export smoke test:

1. Complete at least two main trials.
2. Choose `Follow AI` once.
3. Choose `Choose Opposite` once.
4. Finish or jump to debrief in debug mode.

Current expected decision-event fields:

- `participant_id`
- `condition_id`
- `session_id`
- `trial_id`
- `trial_index`
- `decision`
- `latency_ms`
- `ai_reco`
- `ground_truth`
- `follow_ai`
- `ai_correct`
- `cue_source`
- `cue_modules`
- agent metadata when applicable

## 6. Export Data

Use the debug panel export links or open these URLs:

```text
http://localhost:3000/api/export?format=json
http://localhost:3000/api/export?format=csv
http://localhost:3000/api/export?format=csv&event_type=decision
```

Useful filters:

```text
http://localhost:3000/api/export?format=csv&condition_id=user_set
http://localhost:3000/api/export?format=json&study_run_id=all
http://localhost:3000/api/events/preview?event_type=decision&condition_id=control
```

Check that:

- JSON export is a valid array of events.
- CSV export has one row per event.
- `decision` rows include trust-calibration fields.
- Cue metadata is present when applicable.
- Practice-trial decisions are not exported as main-task decision rows.

Use `docs/export-qa-checklist.md` for the stricter export smoke test, condition coverage test, full-session test, filter QA, row-count assertions, and data-quality checks.
Use `docs/export-analysis-workflow.md` when the review should continue from
export validation into trust-calibration summary output.

## 7. HSF Review After Confirmed Implementation

After Week 9 HSF implementation, repeat the walkthrough and additionally confirm:

- Debug panel shows active HSF dimensions.
- Debug panel shows HSF cue condition ID.
- Debug panel shows trial performance condition.
- Debug panel shows confidence-signal level.
- Decision exports include approved HSF fields.
- Manipulation-check responses export as their own event type if implemented.
- Existing trust-calibration fields still appear unchanged.

Expected HSF export fields after implementation, subject to research approval:

- `hsf_cue_condition_id`
- `hsf_dimensions`
- `appearance_level`
- `communication_level`
- `relationality_level`
- `agency_level`
- `confidence_signal_level`
- `performance_condition`

## 8. Notes to Record During Pilot Review

Use `docs/internal-pilot-notes.md` for the full internal pilot note template.
For quick review, record:

```text
Study run:
Reviewer:
Date:
Condition reviewed:
Trials reviewed:

Participant role clear? yes/no
Decision buttons clear? yes/no
Cue manipulation visible? yes/no
Cue manipulation too obvious or distracting? yes/no
Any evidence/rationale wording confusing?
Any condition with heavier reading load?
Any visual salience imbalance between Follow AI and Choose Opposite?
Any export field missing for analysis?
Recommended revision:
```

## Current Limitation

This walkthrough covers the current cue-source implementation. It does not prove that final HSF cue manipulations are ready. Final HSF readiness requires confirmed cue definitions, approved stimuli, HSF metadata in logs, and manipulation-check review.
