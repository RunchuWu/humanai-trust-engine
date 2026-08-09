# Research Team Review Packet

This packet summarizes what Andrya or the research team should review before Week 9 implementation begins.

## Review Goal

Confirm the research design decisions needed to move from draft HSF planning to runtime implementation.

The current recommendation is to keep a controlled decision-based experiment with fixed, reviewable stimuli unless Andrya confirms a shift toward interactive AI collaboration.

## Review Order

1. `docs/andrea-alignment-email.md`
2. `docs/research-decision-tracker.md`
3. `docs/participant-format-options.md`
4. `docs/hsf-cue-definitions.md`
5. `docs/hsf-cue-interface-note.md`
6. `docs/hsf-stimulus-design.md`
7. `docs/hsf-current-trial-readiness.md`
8. `docs/candidate-trial-expansion-bank.md`
9. `docs/ui-salience-reading-load-audit.md`
10. `docs/hsf-manipulation-checks.md`
11. `docs/manipulation-check-implementation-spec.md`
12. `docs/analysis-plan.md`
13. `docs/openai-api-scope.md`

Current QA and packaging evidence:

- `docs/export-qa-checklist.md`
- `docs/verification-log.md`
- `docs/final-submission-checklist.md`

Implementation documents to use after decisions are confirmed:

- `docs/hsf-implementation-handoff.md`
- `docs/hsf-implementation-backlog.md`

## Decisions Needed

| Decision ID | Needed confirmation | Recommended current answer | Unlocks |
| --- | --- | --- | --- |
| RD-01 | Participant-facing format | Controlled decision-based task with fixed stimuli | Whether Week 9 updates static metadata or changes interaction model |
| RD-02 | Priority HSF dimensions | Start with agency, communication, behavior unless all five are required | Which fields, cues, and manipulation checks become implementation priorities |
| RD-03 | Condition structure | Reduced factorial or current cue-source conditions with HSF metadata | Assignment labels, debug forcing, and export schema |
| RD-04 | Stimulus production process | Offline AI-assisted drafting is acceptable only if reviewed and committed as static stimuli | Whether any researcher-facing drafting support is needed |
| RD-05 | Stimulus approval owner | Assign one research owner plus optional team review | Final stimulus approval workflow |
| RD-06 | Confidence role | Treat confidence as separate signal-strength factor | `confidence_signal_level` design and crossing with correctness |
| RD-07 | Manipulation-check placement | Short end-of-task pilot block first | UI placement and logging schema |
| RD-08 | User-set condition role | Confirm whether customization is central enough to keep | Whether `user_set` remains participant-facing |
| RD-09 | OpenAI API scope | Defer live participant-facing API; keep API work offline/researcher-facing unless the study changes | Whether live interaction work belongs in this phase |
| RD-10 | Final pilot scope | Current 10 trials for flow pilot; expand for HSF analysis | Trial expansion and matrix population |

## Suggested Review Questions

1. Should the immediate experiment remain a controlled fixed-stimulus task?
2. Which HSF dimensions should be active factors in the first pilot?
3. Should current `control`, `industry_set`, and `user_set` conditions remain, or should they be replaced by named HSF conditions?
4. Should confidence be analyzed as communication, behavior, or separate signal strength?
5. Should manipulation checks be end-of-task or trial-level?
6. Who approves final stimulus text before it enters the app?
7. Should participant customization remain in the next pilot?
8. Is any live participant-facing API interaction needed, or should API use remain offline and researcher-facing?

## Current Evidence Snapshot

Current app supports:

- controlled staged participant flow
- fixed operations/drone trials
- cue-source conditions
- modular cue display
- user-set agent configuration
- decision logging
- JSON/CSV export
- researcher debug mode

Current review artifacts now also include:

- a 16-trial candidate expansion bank
- a UI salience and rationale reading-load audit
- a manipulation-check implementation contract
- an analysis plan for trust calibration, HSF, manipulation checks, and blame/accountability
- an export QA checklist
- a verification log showing current lint, TypeScript, build, and runtime smoke checks passed

Current app does not yet support:

- explicit HSF metadata in runtime event exports
- debug display of HSF dimensions
- manipulation-check UI/logging
- final HSF cue-condition assignment
- approved HSF stimulus matrix

## Recommended Decision Outcome

If the research team agrees with the controlled fixed-stimulus path:

1. Confirm priority HSF dimensions.
2. Confirm reduced condition structure.
3. Approve or revise manipulation-check item set.
4. Approve minimal pilot scope or request expanded matrix.
5. Proceed with `docs/hsf-implementation-backlog.md`.

If the research team wants interactive AI collaboration:

1. Pause current Week 9 static metadata implementation.
2. Re-scope participant flow and logging requirements.
3. Define live API constraints, output schemas, latency logging, and cue-drift checks.
4. Update `docs/openai-api-scope.md` and implementation backlog before coding.
