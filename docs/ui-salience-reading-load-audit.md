# UI Salience and Reading-Load Audit

This audit supports the Week 10 pilot-readiness task: check whether cue conditions introduce unintended visual salience or reading burden. It reviews the current controlled decision-task UI before final HSF runtime metadata is implemented.

## Scope

Sources reviewed:

- `src/lib/cue-config.ts`
- `src/lib/trials.ts`
- `src/app/task/page.tsx`
- `src/app/task/task.module.css`
- `docs/researcher-walkthrough.md`

Current conditions reviewed:

| Condition | Current cue behavior |
| --- | --- |
| `control` | Plain AI recommendation, control rationale, no avatar/name/personality/confidence line |
| `industry_set` | Fixed named agent, avatar, warm tone, personality label, warm rationale, confidence line |
| `user_set` | Participant completes agent setup, then sees selected name/avatar/personality, warm or neutral rationale depending on tone, confidence line when cue module is enabled |

## Participant UI Redesign Review

The shared participant interface was redesigned on 2026-07-20 without changing
condition logic or runtime stimuli. The current shared structure is:

- A single operations-task header with onboarding, main-task, and completed
  states.
- An accessible trial progress bar during the main task and at completion.
- One 880px maximum workspace used across onboarding, practice, trials, and
  debrief.
- A stable, non-clickable Situation / Evidence / Recommendation indicator on
  main trials.
- Equal-width and equal-style `Follow AI` and `Choose Opposite` controls.
- Single-column controls on mobile with wrapping action labels.

The redesign intentionally does not add a control-condition placeholder for the
agent header. It also does not change avatar, name, personality, tone,
confidence, or rationale content. This preserves current experimental behavior,
but the cue salience and reading-load risks below still require mentor review
before a final HSF design is activated.

Automated verification covers lint, types, data QA, route compatibility, export
contracts, and production build. Visual screenshots and keyboard walkthroughs
at the four target viewports remain pending because no interactive browser
target was available in the verification session.

## Current UI Balance

### Stable Across Conditions

These elements are currently held constant across conditions:

- Trial sequence: operational situation, evidence, then AI recommendation.
- Operational situation text and evidence list.
- AI recommendation target and opposite action.
- Main decision button placement, styling, size, and labels.
- `Follow AI` and `Choose Opposite` explanatory hint.
- Trial order and main-trial count.

This supports a controlled fixed-stimulus pilot because the core operational evidence and decision controls are not condition-specific.

### Condition-Specific Salience

The following visible elements vary by cue condition:

| Element | Current behavior | Salience risk |
| --- | --- | --- |
| Agent header | Appears only when cue modules are enabled | Cued conditions may receive extra visual weight before the recommendation |
| Avatar badge | Appears only when `avatar` is enabled | Blue circular badge can draw attention independently of intended HSF cue |
| Agent name | Replaces generic "AI recommends" framing when enabled | Name cue is visible and likely salient |
| Personality label | Appears in the agent header when enabled | Adds extra text and a social framing cue |
| Confidence line | Appears only when `confidence_explanation` is enabled | Adds both numeric confidence and extra reading load |
| User setup screen | Appears only for `user_set` | Adds pre-task agency/customization exposure not present in other conditions |

These are expected manipulations for the current cue-source design, but they are not clean HSF factor manipulations yet. For final HSF comparisons, the team should decide which of these differences are intentional factors and which should be neutralized.

## Reading-Load Check

A text-length check was run against the current 10 trials. The warm rationale is longer than the control rationale for every trial:

| Trial | Control rationale words | Warm rationale words | Difference |
| --- | ---: | ---: | ---: |
| `ops_01` | 13 | 21 | +8 |
| `ops_02` | 18 | 21 | +3 |
| `ops_03` | 21 | 23 | +2 |
| `ops_04` | 12 | 21 | +9 |
| `ops_05` | 14 | 20 | +6 |
| `ops_06` | 16 | 21 | +5 |
| `ops_07` | 19 | 23 | +4 |
| `ops_08` | 17 | 21 | +4 |
| `ops_09` | 20 | 23 | +3 |
| `ops_10` | 14 | 22 | +8 |

Summary:

- Minimum warm-minus-control difference: 2 words.
- Maximum warm-minus-control difference: 9 words.
- Average warm-minus-control difference: 5.2 words.

The difference is modest, but it is systematic. If warm tone is used as a final experimental factor, the final stimulus approval process should either accept this as part of the manipulation or tighten rationale length so reading load is more comparable.

## Current Pilot Risks

1. Cued conditions have more visible UI content than control.
2. Warm rationales are consistently longer than control rationales.
3. The `user_set` condition includes an extra setup interaction, so it may measure customization/ownership in addition to cue perception.
4. Confidence appears only when the cue module is enabled, so confidence may be confounded with humanlike presentation unless it becomes an explicit factor.
5. Avatar/name/personality are bundled in current `industry_set` and `user_set` conditions, so the current interface cannot isolate individual HSF cue dimensions.

## Pilot Review Checklist

During internal pilot review, record:

- Whether participants notice the agent header before reading the recommendation.
- Whether the avatar, name, or personality label changes perceived competence or warmth.
- Whether the confidence line changes perceived recommendation reliability.
- Whether the extra `user_set` setup screen changes engagement or ownership.
- Whether decision buttons remain equally visible and easy to distinguish.
- Whether participants spend noticeably longer in cued conditions because of added text.
- Whether any participant mistakes `Choose Opposite` for a negative evaluation of the AI rather than the opposite operational action.

## Recommended Adjustments Before Final HSF Pilot

Before final HSF implementation, decide:

1. Should control use an empty placeholder area to match vertical space when cued conditions show an agent header?
2. Should confidence be a separate trial-level factor instead of bundled with humanlike cues?
3. Should warm and control rationales be length-matched during stimulus approval?
4. Should `user_set` remain a study condition, become a setup-only exploratory condition, or be removed from the main HSF matrix?
5. Should each HSF condition expose only the target cue dimension while holding non-target cue modules constant?

## Current Conclusion

The current UI is acceptable for a small current-state pilot review, especially for checking flow, comprehension, decision logging, and coarse cue visibility. It is not yet clean enough for final HSF factor inference because current cue-source conditions bundle multiple cues and add systematic reading-load differences.
