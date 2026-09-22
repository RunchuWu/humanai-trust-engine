# September 2026: participant and researcher interface redesign

This update publishes the current local English preview implementation: redesigned
participant interfaces, a substantially expanded researcher panel, a new two-part
workflow, new datasets and an evolving research focus. The source, styles, avatar
assets and screenshots are included, so the interfaces can be run from the repository.
This is a runnable research prototype; independent material review and human
pretesting remain pending.

## What changed

| Area | Before | Now |
| --- | --- | --- |
| Participant UI/UX | Operations cards with follow/override responses | Cold, Neutral and Warm presentations; initial/final written or numerical answers; stance, confidence and reflection |
| Researcher panel | Debug controls and basic export | Profile controls, interface comparison, actual task previews, immutable versions, participant links and paired-data inspection/export |
| Workflow | Ten staged operations decisions | Four open judgments followed by eight numerical forecasts, with separate practices and eight final experience ratings |
| Dataset | Transportation/drone operations and binary outcomes | Everyday value judgments and uncertain forecasts across price, attendance, consumption and time |
| Research focus | Following AI and correctness-based calibration | How interface presentation changes responses to fixed advice, including reasons, stance, numerical adjustment and trust-related experience |

The current research focus is reflected in the implemented tasks and measures.
Final RQs, primary outcomes and a matching analysis plan still require confirmation.
Single-cue/factorial designs discussed in the proposal are future experiments.

## Implemented

- Add an English two-part workflow with four open judgments, eight numerical
  forecasts, two practices and eight final experience items.
- Save independent initial responses before releasing fixed AI advice; preserve
  final responses, confidence, stance, optional explanations and reflections.
- Add a researcher workspace for profile configuration, same-material previews,
  immutable study versions, participant links and protected JSON/CSV exports.
- Add Cold, Neutral and Warm interface designs, versioned names and generated
  avatars, plus a participant demo that follows researcher preview settings.
- Preserve the actual AI display, material version and response/exposure event
  references. Restore sessions and handle retries without overwriting answers.
- Retain the original operations workflow at `/task?legacy=1` and archived frozen
  English constraint and prediction studies.
- Add material, API, browser, regression and export-validation scripts; archive the
  original README and distinguish current implementation from historical plans.

## Research status

The canonical two-part bank remains marked for review. Independent semantic
review, human piloting, perceptual manipulation validation and burden assessment
are still pending. The implemented three-profile comparison tests whole interface
packages; it does not isolate individual cues. Advice movement is not a direct
trust score, and synthetic forecast outcomes do not establish a uniquely correct
answer. Open judgments have no correctness score.

Current primary outcomes, sample-size rationale, text-coding protocol and analysis
plan need to be finalized for the new workflow. `analysis-plan.md` and the legacy
export-summary command describe the original operations experiment, not the
two-part dataset. Existing automated/synthetic checks are not participant findings.

The [redesign proposal](experiment-redesign-proposals-zh.md) recommends separating
subjective trust, advice-taking and decision quality, and describes single-cue and
factorial alternatives. Those conditions, objective task banks and feedback
workflows are **proposed future work**, not features of this update.

## Data and deployment

English research uses a persistent local file store. Publishing this implementation
does not deploy the website or verify live collection. No participant records,
deployment credentials or local study exports are included. The public demo does
not record answers; frozen study links use the recording workflow.

## Publication verification — 2026-09-22

The following checks passed against this update. Workflow tests used an isolated
temporary research directory and a separate headless Chrome profile. A passing
check does not validate research materials or a production collection environment.
The English-only publication was rebuilt and its API/browser regressions rerun
after scope separation. All 37 files in the English research UI, library, APIs,
avatar assets and stimulus folders match the original local preview byte for byte.

| Check | Result |
| --- | --- |
| `npm run lint`, `npx tsc --noEmit`, `npm run build` | Passed |
| Current and archived numerical/open material checks | Passed, including metric edge cases, cue invariance and 4+8 task composition |
| Archived constraint material checks | Passed |
| `npm run validate:stimuli` | Passed; three existing legacy reading-load warnings remain documented |
| `npm run check:docs -- --include-readme`, `git diff --check` | Passed |
| Two-part API regression | Passed: fixed/custom 12-task sessions, practices, A/B balance, withheld advice, immutable responses, reflections, retries and authentication |
| Archived mixed/time prediction and constraint API regressions | Passed |
| JSON/CSV export validation | Passed for two-part and archived prediction exports; archived constraint JSON also validated |
| Two-part Chrome regression | Passed: complete workflow, controls, refresh, save-failure retries, mobile/custom setup and data summaries |
| Cross-tab participant demo regression | Passed: profile synchronization, draft preservation, reload, zero preview events and frozen-session isolation |

The source-publication review found no credentials or participant records in the
publication candidates. Documentation screenshots were checked for private UI or
identifiers. Deployed participant collection was not verified.

## Suggested commit descriptions

`feat: redesign participant and researcher interfaces and study workflow`

- Publish the current English previews, redesigned participant UI/UX, researcher
  panel, two-part judgments/forecasts, versioned datasets and paired event export.
- Preserve legacy workflows and add automated material and workflow regressions.

`docs: explain interface, dataset and research direction changes`

- Explain the UI/UX, workflow, dataset and research-focus changes, with screenshots
  and the current implementation/readiness status.
- Separate pending material/pilot validation and proposed redesigns from completed
  engineering work; archive historical README content.
