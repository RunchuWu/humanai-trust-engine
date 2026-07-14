# HSF Stimulus Matrix Template

Use this template to assign approved or candidate trials to the HSF matrix after the research team confirms the final factor structure.

Status: template. Do not treat this as an approved participant-facing stimulus set.

## Matrix Assignment Table

| Cell ID | Agency framing | Confidence signal | AI performance | Humanlike presentation | Candidate trial ID | Scenario title | Reviewer status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HSF-01 | Low | Modest | Correct | Low |  |  | open / candidate / approved / rejected | Baseline calibrated trust when signal and performance are restrained |
| HSF-02 | Low | Modest | Incorrect | Low |  |  | open / candidate / approved / rejected | Baseline override behavior after weak or modest AI signal |
| HSF-03 | Low | Confident | Correct | Low |  |  | open / candidate / approved / rejected | Effect of confidence when capability supports the signal |
| HSF-04 | Low | Confident | Incorrect | Low |  |  | open / candidate / approved / rejected | Trust penalty for overconfident failure without humanlike framing |
| HSF-05 | High | Modest | Correct | Low |  |  | open / candidate / approved / rejected | Agency framing effect when AI is correct but not over-signaling |
| HSF-06 | High | Modest | Incorrect | Low |  |  | open / candidate / approved / rejected | Agency framing risk when AI is wrong but modest |
| HSF-07 | High | Confident | Correct | Low |  |  | open / candidate / approved / rejected | High agency plus high confidence when performance supports it |
| HSF-08 | High | Confident | Incorrect | Low |  |  | open / candidate / approved / rejected | Calibration-threshold test for unsupported agency and confidence |
| HSF-09 | Low | Modest | Correct | High |  |  | open / candidate / approved / rejected | Appearance or relationality effect without high agency or confidence |
| HSF-10 | Low | Modest | Incorrect | High |  |  | open / candidate / approved / rejected | Humanlike presentation penalty when performance fails |
| HSF-11 | Low | Confident | Correct | High |  |  | open / candidate / approved / rejected | Humanlike presentation plus confident correct recommendation |
| HSF-12 | Low | Confident | Incorrect | High |  |  | open / candidate / approved / rejected | Over-signaling test through confidence plus high presentation |
| HSF-13 | High | Modest | Correct | High |  |  | open / candidate / approved / rejected | Humanlike agency with correct but restrained recommendation |
| HSF-14 | High | Modest | Incorrect | High |  |  | open / candidate / approved / rejected | Humanlike agency risk when performance is wrong |
| HSF-15 | High | Confident | Correct | High |  |  | open / candidate / approved / rejected | Strongest trust-building condition if performance supports it |
| HSF-16 | High | Confident | Incorrect | High |  |  | open / candidate / approved / rejected | Strongest calibration-threshold penalty condition |

## Review Instructions

For each matrix cell:

1. Assign a candidate `trial_id`.
2. Confirm the assigned trial can support the intended AI performance condition.
3. Confirm cue wording only changes the intended cue factor.
4. Confirm recommendation length, rationale length, and evidence load remain comparable.
5. Complete `docs/stimulus-approval-worksheet.md` before marking a cell approved.

## Current Trial Fit Notes

Use `docs/hsf-current-trial-readiness.md` to identify possible current candidates.
Use `docs/candidate-trial-expansion-bank.md` if the team wants draft additions for a balanced 16-trial set.

Current trial set limitations:

- It has 10 main trials, not enough to fill all 16 cells without reuse.
- It has 6 AI-correct and 4 AI-incorrect trials.
- Confidence values are all moderate/high, so modest signal cells require rewriting or new metadata.
- Current cue conditions bundle multiple humanlike cues rather than isolating HSF dimensions.
