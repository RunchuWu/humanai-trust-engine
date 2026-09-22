# September 2026 research platform update

Publication status: research prototype. This update makes the new workflows and
their current limitations reviewable in the public repository. It does not report
a completed human study, validated manipulation, or confirmatory research result.

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
- Add an independent Chinese three-interface pilot with 12 common decision tasks,
  invitation management, timing, survey, withdrawal and Supabase-backed production
  storage. Its local test adapter is separate from real collection.
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

English research uses a persistent local file store. Chinese production collection
uses its own Supabase tables. Publishing code does not configure either deployment
or verify live collection. No participant records, deployment credentials or local
study exports are included in this update. The public demo does not record answers.

## Publication verification — 2026-09-22

The following checks passed against this update. Workflow tests used an isolated
temporary research directory, a separate headless Chrome profile and local mock
services. A passing check does not validate research materials or a production
database.

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
| Chinese isolated regression | Passed: three interfaces, 36 decisions, questionnaire, timing, withdrawal, restoration and protected exports |
| Chinese mock Supabase pagination | Passed: 1,201 event rows and new secret-key request headers |

The source-publication review found no credentials or participant records in the
publication candidates. Documentation screenshots were checked for private UI or
identifiers. Live Supabase and deployed participant collection were not verified.

## Suggested commit descriptions

`feat: add versioned research workflows and Chinese pilot`

- Implement two-part judgments and forecasts, configurable interfaces, immutable
  study versions, paired event export and independent Chinese pilot collection.
- Preserve legacy workflows and add automated material and workflow regressions.

`docs: clarify research readiness and publish redesign proposals`

- Document implemented capabilities, deployment requirements and publication checks.
- Separate pending material/pilot validation and proposed redesigns from completed
  engineering work; archive historical README content.
