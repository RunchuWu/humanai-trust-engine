# Draft Alignment Email to Andrea

Subject: Week 7-12 HSF alignment questions and controlled-stimulus direction

Hi Andrea,

I reviewed the current project state against the Week 7-12 HSF alignment plan and wanted to confirm the research direction before making larger implementation changes.

The current working assumption is to keep the participant-facing task as a controlled decision-based experiment with fixed, reviewable stimuli. In that format, the AI recommendations should remain hardcoded during participant sessions so wording, cue strength, performance outcomes, and reading load stay comparable across conditions. I would treat any OpenAI API work as a later researcher-facing stimulus drafting tool unless the study explicitly shifts toward live interactive AI collaboration.

I also mapped the existing interface cues to the five HSF dimensions as a first implementation draft:

| HSF dimension | Current interface representation |
| --- | --- |
| Appearance | Avatar badge and agent visual identity |
| Communication | Tone, first-person wording, confidence language, rationale style |
| Behavior | AI recommendation correctness, rationale quality, performance outcome |
| Relationality | Warmth, supportive language, user-selected assistant framing |
| Agency | Named agent framing, recommendation lead, autonomy or action language |

Could you confirm a few design choices before I update the app schema and cue configuration?

1. Which HSF cue dimensions should be prioritized for the immediate experiment?
2. Should this phase support all five dimensions, or focus on a smaller set such as agency, communication, and behavior?
3. Should the next participant-facing version remain a controlled decision-based experiment with fixed recommendations, become a survey/vignette-style evaluation, or move toward interactive AI collaboration?
4. For the controlled-stimulus path, should AI recommendations be manually written, AI-drafted and then reviewed, or produced through another approved process?
5. What should count as an approved stimulus before it appears in the participant-facing task?
6. Who should review final stimuli for cue clarity, comparability, and research-design alignment?
7. If an OpenAI API is useful later, should it be limited to offline candidate-stimulus drafting, or should we keep open the possibility of participant-facing live interaction?

I also prepared a short review packet and decision tracker so we can keep the implementation gated on explicit research decisions:

- `docs/research-team-review-packet.md`
- `docs/research-decision-tracker.md`
- `docs/participant-format-options.md`
- `docs/hsf-stimulus-design.md`
- `docs/candidate-trial-expansion-bank.md`
- `docs/hsf-manipulation-checks.md`
- `docs/manipulation-check-implementation-spec.md`
- `docs/hsf-implementation-backlog.md`

The current repo also has export QA, runtime smoke-check, and final submission packaging docs:

- `docs/export-qa-checklist.md`
- `docs/verification-log.md`
- `docs/final-submission-checklist.md`

My recommended next step is to define the approved cue dimensions and stimulus review process first, then update the trial schema, cue metadata, debug panel, and exports around that confirmed structure.

Best,
Runchu
