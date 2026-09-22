# Mixed everyday predictions — material version 2

> Archived numerical-only material version. New studies use the [two-part workflow](research-two-part.md).
> Existing frozen links retain the behavior documented here.

This earlier English tool uses `data/stimuli/everyday-prediction-en-v2.json`.
This version broadens the existing before/after-AI workflow to four kinds of
open numerical prediction. It does not introduce the proposed open value-judgment
module, which is documented separately in [the review proposal](open-judgment-study-proposal.md).

## Materials and response units

| Category | Four formal items | Unit / increment |
| --- | --- | --- |
| Price | Desk chair, commuter bicycle, bookshelf, portable speaker | Fictional USD / 1 |
| Attendance | Campus workshop, film night, repair café, walking group | People / 1 |
| Drink consumption | Outdoor games, reading club, volunteer cleanup, board games | Litres / 0.5 |
| Time | Parcel delivery, bus trip, shelf assembly, taxi ride | Minutes / 1 |

Each item includes five recent observations, three contextual clues, a fixed AI
estimate and rationale, response bounds, and an author-constructed held-out outcome.
Price observations include descriptions of the comparable items and appear as
cards. Attendance observations appear as labeled bars and numbers, with the same
registration count as the current event. Consumption cases specify group size,
duration, other drink availability and sufficient supply, so estimates concern
actual consumption rather than how much to purchase. Time cases retain the earlier
uncertain forecasts. All comparison cases, prices and outcomes are fictional;
there is no live model, real marketplace lookup or uniquely deducible answer.

New item IDs are `price_01`–`price_04`, `attendance_01`–`attendance_04`,
`consumption_01`–`consumption_04`, `time_01`–`time_04`. The full set interleaves
categories. The default six-item pilot uses price_01, attendance_01, consumption_01,
time_01, price_02 and attendance_02, covering every category. It is not balanced
within category counts; the full 16-item set has four of each. Practice is a
separate club-attendance forecast, excluded from formal behavioral events.

The shared five-level expression catalog now uses quantity-neutral wording.
The AI estimate, observations and core rationale remain identical across
presentations of the same item. AI certainty is held at 50, as in the preceding
prediction workflow. The final capability/reliability items refer to quantities
and actual values instead of durations; their IDs and constructs are unchanged.

## Interaction and qualitative notes

Participants still submit an independent estimate and confidence before the
server releases advice, then submit a final estimate and confidence. The input
shows each item's unit, bounds and increment, including a decimal keypad for
litres. Server validation enforces the same increment; 12.5 litres is valid,
12.25 litres is not, and 12.5 people is not. Zero remains a valid response.

Each new item also permits an optional explanation of up to 300 characters before
and after AI. It is not required to advance, is not used to generate or personalize
AI advice, and is not automatically scored. Initial explanations become immutable
with the initial numerical estimate. Both explanations survive retries and are
included in research exports. Blank explanations are absent, not zero-valued.
These short notes do not make the task an open value-judgment experiment.

## Version compatibility and export contract

The active material version changes; the workflow (`prediction-v1`), event schema
(3) and numerical metric definition (`prediction-metrics-v1`) are retained.
Existing frozen studies use their saved material/configuration snapshots. The
registry continues to recognize the time-only `everyday-prediction-en-v1` and the
constraint `everyday-en-v1` banks. Old time-study configurations retain their
pilot IDs, integer ranges, wording and questionnaire through version-specific
configuration resolution. The old JSON banks are not rewritten.

Newly written prediction trial events include:

- `trial_category`, `response_unit`, `response_min`, `response_max`, `response_step`;
- `initial_rationale` on initial/final events when supplied;
- `final_rationale` on final events when supplied.

These metadata come from the frozen server-side materials. JSON retains full
material snapshots; CSV includes the metadata and resolved AI text along with
all existing paired-judgment fields. Persisted judgments use an explicit
allowlist. Optional text is escaped for spreadsheet-formula safety in CSV, while
negative numeric metrics remain numbers.

The dashboard no longer pools raw errors as minutes. Raw initial/final absolute
errors are grouped by material version, category and unit. The combined summary
uses error reduction as a percentage of response-range width, retaining the
existing normalized metric. This is a descriptive normalization, not evidence
that unlike tasks have equal difficulty. Analyze participant/trial dependence,
material versions, initial disagreement and domain familiarity explicitly.
WOA remains signed and unclipped, with null for initial agreement; it is not a
trust percentage. No text-similarity trust metric is computed.

## Review and validation

Every item remains pending independent review and human pretesting. Review
plausibility, response ranges, half-litre precision, reading burden, comparable
case relevance, and whether participants have room to form different estimates.
Check initial confidence and advice disagreement by category before pooling data.
Do not infer a general forecast's correctness from a single constructed outcome.

The existing material suite now checks category/unit balance, pilot coverage,
step alignment, five-level isolation, optional-note bounds and archived configs.
API/browser suites cover fractional responses, note immutability, before/after
privacy, retries, export metadata and all four units. To run the API suite against
the archived time-only bank, set `RESEARCH_TEST_DATASET=everyday-prediction-en-v1`.
Other setup, storage and endpoint details are in the [prediction runbook](research-prediction-v3.md).

Completed implementation checks: lint, TypeScript, production build, documentation
references, 796,875 cue/material combinations, fixed/user-set/full-bank API flows,
real-browser four-unit pilot with half-litre answers and optional explanations,
refresh and failed-save retries, JSON/CSV exports, archived time/constraint sessions,
and all three Chinese pilot interfaces using isolated test data. These checks
verify software behavior; independent material review and human pretesting remain
pending.
