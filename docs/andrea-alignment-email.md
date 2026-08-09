# Draft Alignment Email to Andrya

## Final Work Product Preview (ready to send on August 11)

Subject: GSoC 2026 final work product preview

Hi Andrya,

I am preparing my GSoC 2026 Final Work Submission, which opens on August 17
and is due on August 24 at 18:00 UTC.

The core project is now implemented and passing its final verification. It
includes the participant experiment flow, three cue-source conditions, the
transportation and drone operations task, trust-calibration event logging,
researcher/debug tools, JSON/CSV export, accessibility improvements, and
reproducible pilot-data QA.

The public work-product report is available here:

https://github.com/RunchuWu/humanai-trust-engine/blob/main/docs/final-work-product.md

The report clearly separates the completed runtime implementation from the HSF
metadata, manipulation-check, expanded-stimulus, and real-participant pilot
work that still depends on research-team confirmation.

Could you please let me know by August 15 if you see any blocking issue with
the submission or any claim that should be revised? If I do not hear back, I
will keep the research-dependent items documented as future work and complete
the Dashboard submission by August 22 to leave a safety margin before the
official deadline.

I am copying the organization administrator so the organization also has the
final project status and preview link.

Best,
Runchu

---

## Follow-up Email Draft (not sent)

Subject: Quick follow-up: two HSF decisions for the next implementation phase

Hi Andrya,

Thank you again for letting me know that you are reviewing the plan. When you
have a moment, two short decisions would let me move the next implementation
phase forward without locking in the wrong study design. A reply such as `1A,
2A` would be completely sufficient.

1. **Participant-facing format**
   - **A. Controlled decision-based task with fixed AI recommendations**
     (my recommendation for this phase)
   - **B. Interactive AI collaboration experience**

2. **Initial HSF scope**
   - **A. Start with agency, communication, and behavior**, while holding
     appearance and relationality stable (my recommendation for a cleaner
     initial experiment)
   - **B. Include all five HSF dimensions in the immediate experiment**

With those two decisions, I can finalize the condition/stimulus structure and
then implement the corresponding cue metadata, debug inspection, and export
fields. I will keep the current controlled task unchanged until the direction is
confirmed.

Best,
Runchu

---

## Original Alignment Email Draft

Subject: Week 7-12 HSF alignment questions and controlled-stimulus direction

Hi Andrya,

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
