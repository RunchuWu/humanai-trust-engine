# English two-part research workflow

The current `/task` uses `data/stimuli/everyday-two-part-en-v1.json`, workflow
`two-part-v1`, configuration/event schema 4, and trial set `twoPart12`.
There are **12 formal tasks and two practices: 14 task scenarios in total**.
Eight experience-rating items follow separately; they are not task scenarios.

## Task set and interaction

| Part | Formal tasks | Response |
| --- | --- | --- |
| 1: Open judgments | Fairness in group contributions; privacy and a lobby camera; responsibility for a borrowed camera; allocation of a club meeting slot | Written judgment and reasons, stance, self-confidence |
| 2: Numerical forecasts | Two each for price, attendance, drink consumption and time | Estimate in the stated unit, self-confidence, optional short reason |

Each part starts with its own practice. The open practice concerns music in a
shared kitchen; the numerical practice concerns club attendance. Practice has no
pass/fail requirement and is excluded from formal decision events. The numerical
practice appears after all four open tasks, with an explicit Part 2 transition.

Open tasks follow this sequence:

1. Show the common situation and open question. Participants write their own
   judgment and reasons (10–1,200 characters), choose their stance toward a
   stated proposition, and rate self-confidence from 1 to 7.
2. Save this initial response before releasing the assigned AI perspective.
   Initial responses become immutable. Stance has seven ordered agreement
   options and a separate undecided / insufficient-information option.
3. Show the fixed AI perspective through the selected interface profile.
   Participants submit a new written response, stance and self-confidence.
   They may retain their position, qualify it, offer an alternative, or change it.
4. After saving the final response, offer a separate optional reflection of up
   to 1,200 characters. Save or skip it before advancing. The final judgment
   cannot be retrospectively edited during reflection.

Numerical tasks retain the initial estimate → AI advice → final estimate sequence.
Price uses fictional USD, attendance uses people, consumption uses litres in
0.5-litre increments, and time uses minutes. Both estimates have independent
1–7 self-confidence responses and optional short reasons. Outcomes are synthetic
comparison values, not uniquely deducible answers, and remain server-side.

## Configuration, assignment and preview

Use `/task?debug=1` for configuration, materials, preview and exports. `/task` is a
non-recording demo. Preview uses the participant renderer and response forms;
open-task preview includes an A/B viewpoint selector and the reflection stage.
The three-profile comparison applies the same selected viewpoint to every profile.

Each formal open task has two prewritten viewpoints: A supports its proposition,
B opposes it. A session receives exactly two A and two B viewpoints, randomly
assigned independently of its interface profile and persisted with the session.
This ensures within-session balance, not exact topic-by-profile balance across
participants. The demo uses illustrative A viewpoints. Advice never adapts to
the participant's initial text, and there is no live model.

Cold, Neutral and Friendly fixed profiles remain equally likely. Appearance is
independent of cue levels. Optional `user_set` links must be enabled explicitly;
only allowed dimensions can be adjusted before locking the session. AI certainty
stays at level 50 and is distinct from participant self-confidence.

The current visual designs are labeled Cold, Neutral and Warm (stored as
`friendly`). They vary layout, typography, edges and generated avatars, with
versioned rendering for archived studies. See the
[current visual design notes](research-visual-design-v3.md).

New configurations always contain four open tasks followed by eight numerical
tasks. The researcher may reorder within each part; imports and API writes
cannot interleave parts, add tasks or switch this version to a 16-item set.
Save a draft, then freeze to create an immutable version and participant link:
`/task?study=UUID&mode=fixed` or the separately enabled `mode=user_set`.
Refreshing or editing a later draft does not change an existing session.

## Measures and exports

JSON exports preserve frozen configuration, materials, assignments and events;
CSV exports include the actual AI-display snapshot on referenced task events.
Access requires `RESEARCH_ADMIN_KEY`. Initial responses, advice exposure, final
decisions and reflections have separate event IDs and timestamps. A final decision
references its initial response and first AI exposure. Reflection references the
saved decision. Retried requests do not create a second decision or overwrite it.

| Scope | Recorded fields and interpretation |
| --- | --- |
| Both parts | `trial_type`, `part`, material/config versions, profile, cue levels, appearance, display snapshot, initial/final self-confidence and response timing |
| Open judgments | `initial_text`, `final_text`, `initial_stance`, `final_stance`, `viewpoint_id`, `viewpoint_direction` |
| Open stance movement | `stance_change`: increased support, decreased support, unchanged or not comparable; `stance_alignment`: along or against AI's direction, unchanged or not comparable |
| Optional reflection | Independent `reflection` event with `reflection_text`, `reflection_skipped`, `decision_event_id`, initial-response and exposure references |
| Numerical forecasts | Initial/final/AI estimates, unit and bounds, optional reasons, comparison outcome, error measures and `weight_of_advice` under `prediction-metrics-v1` |

Open judgments have no correctness, numerical advice weight or automated text
similarity score. Undecided responses at either time make ordinal movement not
comparable. Unchanged stance can coexist with a meaningful change in reasons or
conditions; raw text remains available for separately designed human coding.
Moving toward AI is a behavioral observation, not proof of increased trust.

For numerical tasks, advice weight is `(final − initial) / (AI − initial)`.
An unchanged estimate gives 0; exactly adopting AI gives 1. Values may be negative
or exceed 1 and are not clipped. When AI and initial estimates coincide, the
weight is null. Numerical error metrics are not pooled with open judgments.

The final eight frozen 1–7 items cover humanlikeness, warmth, closeness, perceived
certainty, clarity, willingness to rely, consideration of other perspectives and
autonomy. These are individual research items, not a validated composite score.

## Research interpretation and material review

The four open scenarios and their perspectives derive from the
[review proposal](open-judgment-study-proposal.md). The eight numerical scenarios
are the first two of each category from the
[archived mixed bank](research-mixed-predictions.md). Facts and core arguments
remain constant across interface profiles; shared cue fragments change their
presentation. Canonical JSON is used directly at runtime.

The user-requested order fixes open judgments first and numerical tasks second.
Differences between parts therefore also reflect order, fatigue and carryover;
they cannot isolate a causal effect of task type. Three-profile comparisons vary
bundled cues, not one cue at a time. Without a no-AI comparison, before/after
changes also cannot isolate AI's effect from reconsidering the question.

Materials are marked pending independent semantic review and human piloting.
Automated checks cover completeness, invariance, assignment and record integrity;
they do not validate perceptual gradients, reading burden or the coding of
written reasoning. Review these before freezing a formal recruitment version.

## Storage, compatibility and verification

Run with `RESEARCH_ADMIN_KEY`; optionally set `RESEARCH_DATA_DIR` to a persistent
directory. The default remains `data/runs/research-v2/research.json`, preserving
the existing file-store format and atomic writes. Use an isolated directory for
QA to keep synthetic events out of participant data.

Existing frozen studies retain their materials, questionnaires and workflows:
constraint `everyday-en-v1`, time prediction `everyday-prediction-en-v1`, and mixed
prediction `everyday-prediction-en-v2`. Original operations remain separate at
`/task?legacy=1`. Export validation accepts schemas 2, 3 and 4.

Checks used for this implementation:

```sh
npm run lint
npx tsc --noEmit
npm run build
npm run test:research:materials
npm run test:research:e2e
npm run test:research:browser
npm run test:prediction:e2e
npm run test:constraint:e2e
npm run validate:research-export -- --file /tmp/two-part-export.json
npm run validate:research-export -- --file /tmp/two-part-export.csv
npm run check:docs -- --include-readme
```

API tests require a running isolated server, `RESEARCH_ADMIN_KEY`, and optionally
`RESEARCH_BASE_URL` (default `http://127.0.0.1:3101`). Browser tests also require
Chrome with remote debugging; see the environment defaults at the top of
`scripts/test-research-browser.mjs`. Coverage includes complete fixed and self-set
sessions, both practices, server-side advice withholding, text and numeric
validation, refresh restoration, save-failure retries, duplicate submissions,
mobile/touch/keyboard interaction, and separate data summaries.
