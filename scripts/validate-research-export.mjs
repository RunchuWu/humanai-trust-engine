import assert from "node:assert/strict";
import fs from "node:fs";
const fileIndex = process.argv.indexOf("--file");
if (fileIndex < 0 || !process.argv[fileIndex + 1]) throw new Error("Usage: npm run validate:research-export -- --file /path/to/export.json (or .csv)");
const text = fs.readFileSync(process.argv[fileIndex + 1], "utf8").replace(/^\uFEFF/, "");
function csvRows(text) {
  const rows = []; let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
    else if (c === "," && !quoted) { row.push(cell); cell = ""; }
    else if (c === "\n" && !quoted) { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  assert.equal(quoted, false, "Unclosed CSV quote");
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
let events, studies;
if (text.trimStart().startsWith("{")) {
  const data = JSON.parse(text); assert.ok([2,3,4].includes(data.schema_version)); events = data.events; studies = data.studies;
  assert.ok(data.studies.every(s => s.materials && s.config && s.id));
  for (const session of data.sessions) assert.ok(!("tokenHash" in session));
} else {
  const [header, ...rows] = csvRows(text);
  events = rows.filter(row => row.some(Boolean)).map(row => {
    assert.equal(row.length, header.length);
    const e = Object.fromEntries(header.map((k, i) => [k, row[i]]));
    for (const k of ["schema_version", "config_version", "timestamp_ms", "trial_index", "latency_ms", "thinking_time_ms", "response_value", "scale_min", "scale_max", "client_shown_at_ms", "initial_judgment_time_ms", "initial_estimate", "initial_confidence", "ai_estimate", "final_estimate", "final_confidence", "outcome", "initial_abs_error", "final_abs_error", "ai_abs_error", "error_reduction", "normalized_error_reduction", "estimate_shift", "weight_of_advice", "advice_distance_initial", "advice_distance_final", "response_min", "response_max", "response_step", "part"]) if (e[k] !== "" && e[k] !== undefined) e[k] = Number(e[k]);
    for (const k of ["ai_correct", "follow_ai", "correct"]) if (e[k] !== "") { assert.ok(["true", "false"].includes(e[k])); e[k] = e[k] === "true"; }
    if (e.weight_of_advice === "") e.weight_of_advice = null;
    e.cue_levels = Object.fromEntries(["name", "tone", "avatar", "personality", "framing", "confidence"].map(d => [d, Number(e[`${d}_level`])]));
    if (e.resolved_stimulus) e.resolved_stimulus = JSON.parse(e.resolved_stimulus);
    return e;
  });
}
assert.ok(Array.isArray(events) && events.length, "Export has no events");
const initialIds = new Set();
const ids = new Set(), decisions = new Set(), exposures = new Map(), surveys = new Set();
for (const e of events) {
  assert.ok([2,3,4].includes(e.schema_version)); assert.ok(e.study_id && e.session_id && e.participant_id && e.config_version);
  assert.ok(!ids.has(e.event_id)); ids.add(e.event_id);
  assert.ok(["session_started", "configuration_locked", "initial_judgment", "reflection", "task_shown", "stage_shown", "decision", "manipulation_check"].includes(e.event_type));
  assert.ok(["researcher_fixed", "user_set"].includes(e.config_source));
  assert.ok(["cold", "neutral", "friendly"].includes(e.appearance));
  for (const dimension of ["name", "tone", "avatar", "personality", "framing", "confidence"]) assert.ok([0, 25, 50, 75, 100].includes(e.cue_levels[dimension]));
  if (e.event_type === "initial_judgment") { const id = `${e.session_id}:${e.trial_id}`; assert.ok(!initialIds.has(id)); initialIds.add(id); }
  if (e.event_type === "stage_shown" && e.stage === "recommendation") { assert.ok(e.exposure_id && e.resolved_stimulus); assert.ok(!exposures.has(e.exposure_id)); exposures.set(e.exposure_id, e); }
  if (e.event_type === "manipulation_check") { const id = `${e.session_id}:${e.item_id}`; assert.ok(!surveys.has(id)); surveys.add(id); assert.ok(Number.isInteger(e.response_value) && e.response_value >= 1 && e.response_value <= 7); assert.equal(e.scale_min, 1); assert.equal(e.scale_max, 7); assert.ok(e.item_text); }
}
for (const e of events.filter(e => e.event_type === "decision")) {
  const id = `${e.session_id}:${e.trial_id}`; assert.ok(!decisions.has(id)); decisions.add(id);
  const exposure = exposures.get(e.exposure_id); assert.ok(exposure, `Missing snapshot ${e.exposure_id}`);
  assert.equal(exposure.session_id, e.session_id); assert.equal(exposure.trial_id, e.trial_id); assert.equal(exposure.config_version, e.config_version);
  assert.deepEqual(exposure.cue_levels, e.cue_levels);
  if (e.trial_type === "open_judgment") {
    assert.equal(e.part,1);
    const initial=events.find(row=>row.event_id===e.initial_judgment_id);
    assert.ok(initial&&initial.event_type==="initial_judgment");
    assert.equal(initial.session_id,e.session_id);assert.equal(initial.trial_id,e.trial_id);
    assert.equal(initial.initial_text,e.initial_text);assert.equal(initial.initial_stance,e.initial_stance);
    assert.equal(exposure.initial_judgment_id,initial.event_id);
    assert.equal(exposure.resolved_stimulus.viewpointId,e.viewpoint_id);
    assert.equal(exposure.resolved_stimulus.viewpointDirection,e.viewpoint_direction);
    for(const field of ["correct","weight_of_advice","outcome","ai_estimate","initial_abs_error"]) assert.ok(e[field]===undefined||e[field]===""||e[field]===null, `Unexpected numeric score ${field}`);
    assert.ok(e.initial_text.trim().length>=10&&e.final_text.trim().length>=10);
    const stances=["strongly_disagree","disagree","somewhat_disagree","neutral","somewhat_agree","agree","strongly_agree","undecided"];
    assert.ok(stances.includes(e.initial_stance)&&stances.includes(e.final_stance));
    const uncertain=e.initial_stance==="undecided"||e.final_stance==="undecided";
    const shift=Math.sign(stances.indexOf(e.final_stance)-stances.indexOf(e.initial_stance));
    assert.equal(e.stance_change,uncertain?"not_comparable":shift===0?"unchanged":shift>0?"increased_support":"decreased_support");
    assert.equal(e.stance_alignment,uncertain?"not_comparable":shift===0?"unchanged":shift===(e.viewpoint_direction==="support"?1:-1)?"along_ai_direction":"against_ai_direction");
    for(const value of [e.initial_confidence,e.final_confidence])assert.ok(Number.isInteger(value)&&value>=1&&value<=7);
    const material=studies?.find(s=>s.id===e.study_id)?.materials.trials.find(t=>t.id===e.trial_id);
    if(material)assert.equal(exposure.resolved_stimulus.coreReason,material.viewpoints.find(v=>v.id===e.viewpoint_id).reason);
  } else if (e.workflow === "prediction-v1" || e.trial_type === "prediction") {
    const initial = events.find(row => row.event_id === e.initial_judgment_id);
    assert.ok(initial && initial.event_type === "initial_judgment", "Missing initial judgment");
    assert.equal(initial.session_id,e.session_id); assert.equal(initial.trial_id,e.trial_id);
    assert.equal(exposure.initial_judgment_id, initial.event_id);
    assert.equal(e.initial_estimate, initial.initial_estimate); assert.equal(e.initial_confidence, initial.initial_confidence);
    assert.equal(e.ai_estimate, exposure.resolved_stimulus.aiEstimate);
    assert.equal(e.initial_abs_error, Math.abs(e.initial_estimate-e.outcome));
    assert.equal(e.final_abs_error, Math.abs(e.final_estimate-e.outcome));
    assert.equal(e.ai_abs_error, Math.abs(e.ai_estimate-e.outcome));
    assert.equal(e.error_reduction, e.initial_abs_error-e.final_abs_error);
    assert.equal(e.estimate_shift, e.final_estimate-e.initial_estimate);
    assert.equal(e.weight_of_advice, e.ai_estimate===e.initial_estimate ? null : e.estimate_shift/(e.ai_estimate-e.initial_estimate));
    assert.equal(e.advice_distance_initial,Math.abs(e.ai_estimate-e.initial_estimate));
    assert.equal(e.advice_distance_final,Math.abs(e.ai_estimate-e.final_estimate));
    for(const c of [e.initial_confidence,e.final_confidence]) assert.ok(Number.isInteger(c)&&c>=1&&c<=7);
    if(e.response_unit) {
      // Older time-only exposures/initials may predate response-unit metadata.
      if(e.dataset_version === "everyday-prediction-en-v1") {
        assert.equal(exposure.response_unit || exposure.resolved_stimulus.unit,e.response_unit);
        assert.equal(initial.response_unit || "minutes",e.response_unit);
      } else {
        assert.equal(exposure.response_unit,e.response_unit); assert.equal(initial.response_unit,e.response_unit);
      }
      assert.equal(exposure.resolved_stimulus.unit,e.response_unit);
      assert.equal(e.initial_rationale,initial.initial_rationale);
      assert.ok(e.response_max>e.response_min && e.response_step>0);
      for(const value of [e.initial_estimate,e.final_estimate]) {
        assert.ok(value>=e.response_min&&value<=e.response_max);
        const steps=(value-e.response_min)/e.response_step;assert.ok(Math.abs(steps-Math.round(steps))<1e-9);
      }
      assert.equal(e.normalized_error_reduction,e.error_reduction/(e.response_max-e.response_min));
    }
    const material=studies?.find(s=>s.id===e.study_id)?.materials.trials.find(t=>t.id===e.trial_id);
    if(material) {
      if(e.response_unit) {assert.equal(e.response_unit,material.unit);assert.equal(e.trial_category,material.category);}
      assert.equal(e.outcome,material.outcome);assert.equal(e.ai_estimate,material.aiEstimate);
      assert.equal(e.normalized_error_reduction,e.error_reduction/(material.estimateRange.max-material.estimateRange.min));
      assert.equal(exposure.resolved_stimulus.coreReason,material.coreReason);
    }
  } else {
  assert.ok(["proceed", "reject"].includes(e.ai_reco) && ["proceed", "reject"].includes(e.ground_truth));
  assert.equal(e.ai_correct, e.ai_reco === e.ground_truth); assert.equal(e.follow_ai, e.decision === "accept"); assert.equal(e.correct, e.follow_ai === e.ai_correct);
  }
  assert.ok(Number.isFinite(e.latency_ms) && e.latency_ms >= 0 && Number.isFinite(e.thinking_time_ms) && e.thinking_time_ms >= 0 && e.thinking_time_ms <= e.latency_ms);
}
const reflectionIds=new Set();
for(const e of events.filter(e=>e.event_type==="reflection")) {
 const d=events.find(d=>d.event_id===e.decision_event_id&&d.event_type==="decision");assert.ok(d&&d.trial_type==="open_judgment");
 assert.ok(!reflectionIds.has(e.decision_event_id));reflectionIds.add(e.decision_event_id);
 assert.equal(d.session_id,e.session_id);assert.equal(d.trial_id,e.trial_id);assert.equal(d.exposure_id,e.exposure_id);
 assert.equal(String(e.reflection_skipped),String(!e.reflection_text));
}
console.log(`Research export valid: ${events.length} events, ${decisions.size} decisions, ${exposures.size} snapshots, ${surveys.size} ratings.`);
