# Research Decision Tracker

This tracker captures research decisions that must be confirmed before Week 9 runtime HSF implementation. It should be updated after Andrea or the research team responds.

## Status Legend

| Status | Meaning |
| --- | --- |
| Open | Needs research-team decision before implementation |
| Recommended | A working recommendation exists, but not confirmed |
| Confirmed | Approved for implementation |
| Deferred | Explicitly postponed |

## Decisions

| ID | Decision | Current recommendation | Status | Implementation impact |
| --- | --- | --- | --- | --- |
| RD-01 | Participant-facing format | Keep controlled decision-based task with fixed stimuli | Recommended | Determines whether Week 9 updates static trial/cue metadata or designs live interaction |
| RD-02 | Priority HSF dimensions | Start with agency, communication, and behavior unless all five are required | Open | Determines which condition metadata and manipulation checks become first-class fields |
| RD-03 | Condition structure | Use reduced factorial or current cue-source conditions with explicit HSF metadata before full 16-cell matrix | Open | Determines condition IDs, assignment logic, debug forcing, and export fields |
| RD-04 | Stimulus production process | AI-assisted offline drafting allowed only if reviewed and committed as static stimuli | Recommended | Determines whether an API tool is needed before participant sessions |
| RD-05 | Stimulus approval owner | Research team reviews cue clarity, comparability, and ground truth before app inclusion | Open | Determines approval workflow and final trial set |
| RD-06 | Confidence role | Treat confidence as a signal-strength factor that can be represented in communication and behavior analyses | Open | Determines `confidence_signal_level` and whether confidence is crossed with correctness |
| RD-07 | Manipulation-check placement | Start with short end-of-task pilot block, then decide if selected trial-level checks are needed | Recommended | Determines UI placement, event schema, export rows, and participant burden |
| RD-08 | User-set condition role | Decide whether to retain customization in HSF pilot or pause it for cleaner manipulation | Open | Determines whether `user_set` remains a participant-facing condition |
| RD-09 | OpenAI API scope | Defer live participant-facing API; consider researcher-facing drafting tool only | Recommended | Determines whether API integration belongs in Week 9-12 or future work |
| RD-10 | Final pilot scope | Use current 10 trials as minimal pilot base or expand to approved HSF matrix | Open | Determines trial expansion work and pilot readiness |

## Decision Details

### RD-01: Participant-Facing Format

Options:

- Controlled decision-based task with fixed AI recommendations.
- Survey/vignette-style evaluation.
- Interactive AI collaboration experience.

Recommended default:

- Controlled decision-based task with fixed stimuli.

Why it matters:

- This determines whether the app should continue using static trial configuration or shift toward live interaction and response logging.

Decision support:

- See `docs/participant-format-options.md`.

### RD-02: Priority HSF Dimensions

Options:

- All five dimensions: appearance, communication, behavior, relationality, agency.
- Smaller initial set such as agency, communication, behavior.
- One primary dimension with others held constant.

Recommended default:

- Start with a smaller set if the immediate experiment needs cleaner interpretation.

Why it matters:

- The more dimensions are active, the larger the stimulus matrix and manipulation-check burden.

Decision support:

- See `docs/hsf-cue-definitions.md`.
- See `docs/hsf-cue-interface-note.md`.
- See `docs/hsf-manipulation-checks.md`.

### RD-03: Condition Structure

Options:

- Preserve `control`, `industry_set`, `user_set` and add HSF metadata.
- Replace conditions with named HSF cue conditions.
- Full factorial matrix.
- Reduced factorial matrix.

Recommended default:

- Preserve compatibility first, then add HSF metadata or reduced-factorial labels once approved.

Why it matters:

- This affects assignment logic, export interpretation, and debug forcing.

Decision support:

- See `docs/hsf-stimulus-design.md`.
- See `docs/hsf-stimulus-matrix-template.md`.
- See `docs/hsf-implementation-handoff.md`.

### RD-04: Stimulus Production Process

Options:

- Manually written stimuli.
- AI-drafted, researcher-reviewed stimuli.
- Another approved drafting workflow.

Recommended default:

- AI-assisted drafting can be used offline, but only approved static stimuli should be participant-facing.

Why it matters:

- The participant task depends on reviewable and reproducible wording.

Decision support:

- See `docs/openai-api-scope.md`.
- See `docs/candidate-trial-expansion-bank.md`.

### RD-05: Stimulus Approval Owner

Options:

- Andrea reviews final stimuli.
- Research team jointly reviews final stimuli.
- A designated reviewer approves each stimulus before implementation.

Recommended default:

- Assign one approval owner plus optional research-team review.

Why it matters:

- Prevents unapproved cue confounds from entering the participant task.

Decision support:

- See `docs/stimulus-approval-worksheet.md`.
- See `docs/ui-salience-reading-load-audit.md`.

### RD-06: Confidence Role

Options:

- Confidence is part of communication.
- Confidence is part of behavior.
- Confidence is a separate signal-strength factor.

Recommended default:

- Treat confidence as a separate signal-strength factor, then map it into communication/behavior analyses as needed.

Why it matters:

- Confidence can otherwise become confounded with correctness or explanation quality.

Decision support:

- See `docs/hsf-current-trial-readiness.md`.
- See `docs/analysis-plan.md`.

### RD-07: Manipulation-Check Placement

Options:

- After every trial.
- After selected trials.
- End-of-task block.

Recommended default:

- Short end-of-task block for internal pilot; selected trial-level checks only if needed.

Why it matters:

- Trial-level checks improve precision but may increase burden and reveal the manipulation.

Decision support:

- See `docs/hsf-manipulation-checks.md`.
- See `docs/manipulation-check-implementation-spec.md`.

### RD-08: User-Set Condition Role

Options:

- Keep `user_set` as a main HSF condition.
- Keep it only for exploratory review.
- Pause it for a cleaner controlled HSF pilot.

Recommended default:

- Decide based on whether participant customization is central to the research question.

Why it matters:

- User customization can add realism but makes cue intensity harder to control.

Decision support:

- See `docs/participant-format-options.md`.
- See `docs/ui-salience-reading-load-audit.md`.

### RD-09: OpenAI API Scope

Options:

- No API in this phase.
- Researcher-facing offline stimulus drafting tool.
- Live participant-facing interaction.

Recommended default:

- No live participant-facing API until the research question shifts toward interactive collaboration.

Why it matters:

- Live generation undermines fixed-stimulus comparability unless the study is explicitly about real-time AI collaboration.

Scope note:

- See `docs/openai-api-scope.md`.

### RD-10: Final Pilot Scope

Options:

- Minimal pilot with current 10 trials.
- Expanded balanced trial set.
- Full or reduced HSF matrix.

Recommended default:

- Use current 10 trials only for flow/usability review; expand if HSF condition analysis is required.

Why it matters:

- The current set is a reasonable pilot base but not a final HSF factorial stimulus set.

Decision support:

- See `docs/hsf-current-trial-readiness.md`.
- See `docs/candidate-trial-expansion-bank.md`.
- See `docs/export-qa-checklist.md`.

## Update Log

| Date | Update | Source |
| --- | --- | --- |
| 2026-07-11 | Initial tracker created from Week 7-12 plan and current repository audit | Local planning docs |
| 2026-07-11 | Added links to candidate expansion, UI salience, manipulation-check implementation, analysis, and export QA decision support docs | Local planning docs |
| 2026-07-16 | Andrya acknowledged the plan and said feedback would follow; substantive decisions remain pending. Drafted a low-burden follow-up limited to RD-01 and RD-02. | Email reply from Andrya; `docs/andrea-alignment-email.md` |
