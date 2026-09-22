# English prediction workflow (V3)

> Current workflow: [two-part judgments and forecasts](research-two-part.md).
> This page describes the archived numerical-only workflow. [Mixed predictions v2](research-mixed-predictions.md) and the
> time-only bank described below remains archived for existing study links. The
> before/after workflow and metric definitions continue to apply.

The English `/task` experiment now collects an independent forecast before AI
advice and a final forecast afterwards. The participant estimates an uncertain
quantity rather than checks whether a proposed option meets explicit requirements.
The earlier [constraint workflow](research-spectrum-v2.md) remains available for
existing frozen links. Original `/task?legacy=1` remains available.

## Participant and researcher workflow

Open `/task?debug=1` to configure and preview. `/task` is a non-recording demo.
Frozen participant links have the form `/task?study=UUID&mode=fixed`; an optional,
separate `mode=user_set` entry permits only authorized setup changes before practice.
The three fixed profiles remain equally likely per participant, with persisted
assignment. Equal probabilities do not guarantee equal sample counts.

Default studies use **six pilot items plus one practice**. The researcher can
select the full 16-item candidate bank and reorder the selected set. Confidence
wording is held at level 50 in every new profile and cannot be unlocked by imports
or user-set setup. Name, tone, avatar, personality, framing and appearance retain
their controls. This isolates initial interface comparisons from AI certainty;
participant self-confidence is a separate response measure.

Each formal trial follows this sequence:

1. Display recent observations, context and a numerical prediction question in a
   common neutral task card. No agent advice appears on this screen.
2. Participant enters a whole-minute initial estimate and a 1–7 self-confidence
   rating. Both controls begin unanswered; zero is a valid estimate.
3. Persist an immutable `initial_judgment`, then release the AI estimate and
   prewritten rationale. The same shared renderer serves preview and participants.
4. Display the saved initial estimate alongside a blank final-estimate form.
   The participant can retain, partly adjust, or change the estimate in any
   direction, then submit another 1–7 confidence rating.
5. Store a final `decision` referencing the initial judgment and first AI display
   snapshot. Advance without giving outcome feedback.

Practice uses the same sequence. Any valid final estimate advances; participants
are never required to follow AI to pass. Practice responses are excluded from
formal event analysis. After the task there are eight frozen 1–7 ratings:
humanlikeness, warmth, closeness, perceived AI certainty, clarity, willingness to
rely, perceived capability and expected reliability. These are individual study
items, not a validated composite trust scale. Consent describes fixed prewritten
assessments, synthetic tasks, recorded data and the absence of a live model.

The researcher preview uses the participant task renderer and judgment form,
without writing research events. Use the stage selector to compare initial and
AI screens, or submit a preview initial estimate to see it alongside the AI.
The Materials tab exposes the source bank and protected outcome/review details.
Data & exports reports paired errors and movement toward AI; these are descriptive
metrics, with explicit separation from trust ratings.

## Material design and review

Canonical runtime source: `data/stimuli/everyday-prediction-en-v1.json`.
There are four candidate forecasts per category: delivery, travel, waiting and
activities. Each contains five recent observations, three context clues, a
prediction question, a response range, a fixed AI estimate and rationale, and a
held-out comparison outcome. All durations are minutes; all cases are synthetic.
No external/live information or generated model response is needed at runtime.

The held-out outcome is one author-constructed realization, not a value uniquely
deducible from the visible observations. The rationale reflects a plausible
interpretation of those observations and can underestimate or overestimate the
outcome. AI accuracy is therefore continuous; there is no forced 50% binary
correctness. A single realized error does not demonstrate that a forecaster's
reasoning or reliance decision was rational or irrational.

All 17 records contain provenance, an uncertainty note, and pending review status.
Automated completeness and cue-isolation checks do not establish psychological
validity or empirical difficulty. Before formal collection, use the six-item
pilot to assess completion burden, initial-estimate spread, initial confidence,
AI disagreement opportunities, whether AI provides a useful perspective, and
wording clarity. Check cue perceptions separately using the final ratings and
participant feedback. Revise materials before freezing the formal study.

Names and avatars share the existing versioned catalog. Tone/personality/framing/
certainty use shared five-level fragments. Changing a cue cannot change the AI
number, observations or core rationale. The full catalog retains all five
certainty variants for versioned material review, while V3 study validation fixes
certainty at 50. This first comparison varies bundled profiles; it does not
identify the independent causal contribution of each cue.

## Recorded measures and interpretation

`src/lib/research/prediction.ts` defines `prediction-metrics-v1`:

| Field | Definition |
| --- | --- |
| `initial_estimate`, `final_estimate` | Participant's two numerical responses |
| `initial_confidence`, `final_confidence` | Separate 1–7 self-confidence responses |
| `ai_estimate`, `outcome` | Server-owned values from the frozen bank |
| `estimate_shift` | Final minus initial estimate |
| `weight_of_advice` | `(final − initial) / (AI − initial)`; null when initial = AI |
| `advice_distance_initial`, `advice_distance_final` | Absolute distance from AI |
| `advice_movement` | initially_agreed / unchanged / toward_ai / away_from_ai / past_ai |
| `initial_abs_error`, `final_abs_error`, `ai_abs_error` | Absolute deviation from outcome |
| `error_reduction` | Initial absolute error minus final absolute error |
| `normalized_error_reduction` | Error reduction divided by response range width |

WOA is never clipped: negative values and values above one remain in JSON and CSV.
An initially agreeing trial offers no disagreement opportunity, so its WOA is null
(blank in CSV), even if the final estimate later changes. Raw estimates and shifts
preserve that change. Interpret movement together with both confidence responses,
initial disagreement and error changes. None of these behavioral measures alone
is a direct trust score. Retain participant/trial structure when comparing groups;
do not treat repeated judgments as independent participants. The dashboard's raw
mean-minute errors should only be compared within a common material set.

Timing keeps the previous meanings: `latency_ms` spans initial task display to
final submission, and `thinking_time_ms` spans first AI display to final submission.
New `initial_judgment_time_ms` spans initial display to the first submission.
Server timestamps accompany browser display timestamps; refresh does not reset
persisted exposures. Background-tab time is included. These wall-clock measures
are not attention measures or tamper-proof clocks.

## Server enforcement, persistence and compatibility

V3 `StudyConfig` freezes schema version 3, workflow `prediction-v1`, trial set,
order, eight questionnaire items, profiles and the complete material bank. The
existing append-only study-version behavior remains: edits create a new saved
record and never replace a frozen snapshot or active session configuration.

The public frozen-study API withholds `aiEstimate`, AI rationale and all outcomes.
A cookie-authenticated session returns current-trial advice only after a valid
initial judgment has been committed. `advance`, early `shown` or final submission
cannot bypass that requirement. Outcomes, provenance and review notes remain
researcher-only. Researcher preview and the no-save demo deliberately preload AI
advice; they are not the participant data endpoint. A motivated participant can
still browse a public demo to learn materials, so these public examples are not
an anti-cheating boundary; use fresh materials for formal recruitment when needed.

New session actions are `practice_initial` and `initial`, with
`judgment: {estimate, confidence}`. Prediction `practice` and `decision` also use
that object. Identical retries are idempotent; an altered initial value is rejected
after advice release. A saved final response cannot be overwritten by retrying.
Server scoring ignores client-supplied outcomes, AI estimates and metric fields.
Failed browser saves retain inputs and offer retry without advancing.

Existing APIs, researcher bearer-key authentication, HttpOnly session cookies and
atomic local storage continue unchanged. Set `RESEARCH_ADMIN_KEY`; optionally
set `RESEARCH_DATA_DIR` to a persistent writable directory. The default storage
path remains `data/runs/research-v2/research.json` for backward compatibility.
Use a persistent Node host for collection; a serverless temporary filesystem does
not provide durable study storage.

Full JSON exports include frozen materials/configurations and event cross-links.
CSV includes flattened levels, all paired measures and the resolved AI snapshot
on exposure and final rows. Negative numeric values remain numeric CSV values.
New exports may contain V2 and V3 events; discriminate by each event's
`schema_version` and `workflow`, rather than interpreting missing legacy fields as
zero. Old frozen constraint sessions retain their original materials, decisions,
questionnaire and rendering through `ConstraintExperience.tsx`; original operations
logs retain their independent legacy schema.

## Verification

```sh
npm run lint
npx tsc --noEmit
npm run test:research:materials
npm run test:constraint:materials
npm run check:docs
npm run build
```

Run a separate local QA server with a temporary `RESEARCH_DATA_DIR` and a test
researcher key. Set `RESEARCH_BASE_URL` and `RESEARCH_ADMIN_KEY` for the tests:

```sh
npm run test:research:e2e
npm run test:constraint:e2e
npm run test:research:browser
npm run validate:research-export -- --file /tmp/prediction-export.json
npm run validate:research-export -- --file /tmp/prediction-export.csv
```

Browser tests require isolated headless Chrome with a local debugging endpoint
(`CHROME_DEBUG_URL`, default port 9223). API tests exercise fixed/custom six-item
pilots and the full 16-item set, forbidden early advice access, immutable baselines,
restoration, retry idempotency, numeric validation, authoritative metrics and
exports. Browser tests cover initial/final save failure retries, refresh, the full
pilot and questionnaire, sliders and mobile layouts. These automated checks do
not replace a human pilot, material review or a formal research design decision.

Implementation verification completed: lint, TypeScript and production build;
796,875 prediction cue/material combinations plus legacy constraint material
checks; 28 new API trial pairs across fixed/custom pilot and full-bank sessions;
32 legacy constraint decisions; real Chrome before/after preview and six-trial
participant completion, reload and both save-failure retries; JSON/CSV metric and
snapshot validation. Private outcome/answer explanations
from both banks were absent from client bundles. Research review and human pilot
validation remain pending.
