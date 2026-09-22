"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  PILOT_AGENTS, PILOT_ORDERS, PILOT_SURVEY, PILOT_TRIALS,
  type PilotChoice, type PilotCondition, type PilotStage,
} from "@/lib/pilot-content";

import styles from "./pilot.module.css";

type Phase = "welcome" | "instructions" | "practice" | "trial" | "survey" | "done" | "withdrawn";
type SessionResponse = {
  ok: boolean;
  condition: PilotCondition;
  status: string;
  order: string[];
  completedTrialIds: string[];
  surveyDone: boolean;
};

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body), cache: "no-store",
  });
  const data = await response.json().catch(() => ({})) as { ok?: boolean; message?: string };
  if (!response.ok || !data.ok) throw new Error(data.message || "网络暂不可用，请重试。");
  return data;
}

function AgentAvatar({ condition }: { condition: PilotCondition }) {
  return (
    <span className={`${styles.avatar} ${styles[`avatar${condition}`]}`} aria-hidden="true">
      {condition === 1 ? <span className={styles.machineMark}>▦</span> : null}
      {condition === 2 ? <span className={styles.neutralMark}>✦</span> : null}
      {condition === 3 ? <span className={styles.face}><i /><b /></span> : null}
    </span>
  );
}

export default function PilotExperience({ condition, contact, dataRegion, retentionDays }: { condition: PilotCondition; contact: string; dataRegion: string; retentionDays: string }) {
  const searchParams = useSearchParams();
  const preview = searchParams.get("preview") === "1";
  const inviteToken = searchParams.get("invite") ?? "";
  const agent = PILOT_AGENTS[condition];
  const [phase, setPhase] = useState<Phase>("welcome");
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [consent, setConsent] = useState(false);
  const [adult, setAdult] = useState(false);
  const [practiceChoice, setPracticeChoice] = useState<PilotChoice | null>(null);
  const [trialIndex, setTrialIndex] = useState(0);
  const [stage, setStage] = useState<PilotStage>("situation");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState("");
  const [ready, setReady] = useState(false);
  const readStartRef = useRef(0);
  const evidenceStartRef = useRef(0);
  const recommendationStartRef = useRef(0);

  const order = session?.order ?? PILOT_ORDERS.A;
  const trial = useMemo(() => PILOT_TRIALS.find((item) => item.id === order[trialIndex]), [order, trialIndex]);
  const progress = phase === "trial" ? Math.round((trialIndex / 12) * 100) : phase === "survey" || phase === "done" ? 100 : 0;

  const enterStage = useCallback(async (trialId: string, next: PilotStage) => {
    if (!preview) await postJson("/api/pilot/stage", { trialId, stage: next, clientMs: Date.now() });
    // Start the timer only after the stage request succeeds. Network latency is
    // not participant reading or deliberation time.
    const displayedAt = performance.now();
    if (next === "situation") readStartRef.current = displayedAt;
    if (next === "evidence") evidenceStartRef.current = displayedAt;
    if (next === "recommendation") recommendationStartRef.current = displayedAt;
    setStage(next);
  }, [preview]);

  useEffect(() => {
    if (preview || inviteToken) { setReady(true); return; }
    let active = true;
    void fetch("/api/pilot/session", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) return null;
      return await response.json() as SessionResponse;
    }).then(async (data) => {
      if (!active || !data) return;
      if (data.condition !== condition) { setError("这个邀请属于另一种界面，请使用原邀请链接。"); return; }
      setSession(data);
      if (data.status === "complete" || data.surveyDone) { setPhase("done"); return; }
      const nextIndex = data.completedTrialIds.length;
      if (nextIndex >= data.order.length) { setPhase("survey"); return; }
      if (nextIndex > 0) {
        setTrialIndex(nextIndex);
        await enterStage(data.order[nextIndex], "situation");
        if (active) setPhase("trial");
      } else {
        setPhase("instructions");
      }
    }).catch(() => { if (active) setError("无法读取已保存的进度，请刷新重试。"); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [condition, enterStage, inviteToken, preview]);

  async function start() {
    if (!consent || !adult) return;
    setBusy(true); setError("");
    try {
      if (!preview) {
        await postJson("/api/pilot/start", { token: inviteToken, condition, consent, adult });
        const response = await fetch("/api/pilot/session", { cache: "no-store" });
        if (!response.ok) throw new Error("无法读取邀请会话。");
        const data = await response.json() as SessionResponse;
        setSession(data);
        window.history.replaceState(null, "", `/pilot/${condition}`);
      }
      setPhase("instructions");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "无法开始。"); }
    finally { setBusy(false); }
  }

  async function beginTrial() {
    setBusy(true); setError("");
    try {
      await enterStage(order[trialIndex], "situation");
      setPhase("trial");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "无法开始题目。"); }
    finally { setBusy(false); }
  }

  async function advanceStage() {
    if (!trial) return;
    setBusy(true); setError("");
    try { await enterStage(trial.id, stage === "situation" ? "evidence" : "recommendation"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "阶段记录失败。"); }
    finally { setBusy(false); }
  }

  async function decide(choice: PilotChoice) {
    if (!trial || busy) return;
    setBusy(true); setError("");
    const clickedAt = performance.now();
    try {
      if (!preview) {
        const situationTimeMs = Math.round(Math.max(0, evidenceStartRef.current - readStartRef.current));
        const evidenceTimeMs = Math.round(Math.max(0, recommendationStartRef.current - evidenceStartRef.current));
        await postJson("/api/pilot/decision", {
          trialId: trial.id, choice, clientMs: Date.now(),
          situationTimeMs,
          evidenceTimeMs,
          readTimeMs: situationTimeMs + evidenceTimeMs,
          hesitationTimeMs: Math.round(Math.max(0, clickedAt - recommendationStartRef.current)),
        });
      }
      const nextIndex = trialIndex + 1;
      if (nextIndex >= 12) { setPhase("survey"); }
      else {
        await enterStage(order[nextIndex], "situation");
        setTrialIndex(nextIndex);
      }
    } catch (cause) {
      // A successful decision may already have reached the server. Reloading
      // reconciles against the server-side unique (invite, trial) record.
      setError(`${cause instanceof Error ? cause.message : "保存失败。"} 若已点击过，请刷新页面确认进度。`);
    } finally { setBusy(false); }
  }

  async function submitSurvey() {
    if (PILOT_SURVEY.some((item) => !answers[item.id])) { setError("请回答全部评分题。"); return; }
    setBusy(true); setError("");
    try {
      if (!preview) await postJson("/api/pilot/survey", { answers, feedback });
      setPhase("done");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "问卷提交失败。"); }
    finally { setBusy(false); }
  }

  async function withdraw() {
    if (!window.confirm("确定退出并删除本次试点记录吗？此操作不能撤销。")) return;
    setBusy(true); setError("");
    try {
      if (!preview) await postJson("/api/pilot/withdraw", {});
      setPhase("withdrawn");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "退出失败。"); }
    finally { setBusy(false); }
  }

  const recommended = trial ? trial.aiChoice === "action" ? trial.action : trial.alternative : "";
  const opposite = trial ? trial.aiChoice === "action" ? trial.alternative : trial.action : "";

  return (
    <main lang="zh-CN" className={`${styles.page} ${styles[`theme${condition}`]}`}>
      <div className={styles.ambientOne} aria-hidden="true" /><div className={styles.ambientTwo} aria-hidden="true" />
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <div className={styles.brand}><span className={styles.brandIcon}>✳</span><div><strong>人与 AI · 协作决策</strong><small>中文试点研究 · 模拟任务</small></div></div>
          <div className={styles.topRight}><span className={styles.liveDot} />{preview ? "界面预览 · 不保存" : "安全保存的研究会话"}</div>
        </header>
        <div className={styles.progressBar} aria-label={`完成进度 ${progress}%`}><span style={{ width: `${progress}%` }} /></div>

        {error ? <div className={styles.error} role="alert">{error}</div> : null}
        {!ready ? <section className={styles.centerCard}><p>正在检查邀请与进度…</p></section> : null}

        {ready && phase === "welcome" ? <section className={styles.centerCard}>
          <span className={styles.eyebrow}>INVITED PILOT · 预计 15–20 分钟</span>
          <h1>和一个 AI 助手一起<br /><em>做 12 个小决策</em></h1>
          <p className={styles.lead}>你将查看模拟交通与无人机任务中的情境、证据和 AI 建议，再决定采纳建议还是选择另一方案。没有真实车辆或无人机会因你的选择而行动。</p>
          <div className={styles.infoGrid}><div><strong>12 道模拟题</strong><span>先读事实，再看 AI 建议</span></div><div><strong>一个简短问卷</strong><span>评价你刚刚的互动体验</span></div></div>
          <div className={styles.consentBox}>
            <h2>参与说明与同意</h2>
            <p>本试点记录你的选择、答题时间、各阶段停留时间和问卷评分，用于评估界面与研究流程。系统使用匿名邀请码，不要求填写姓名或联系方式。你可以随时退出，并从活动数据库中撤回本次记录；服务提供商可能保留必要的访问日志和备份。</p>
            <p>研究联系人：{contact || "（正式招募前填写）"} · 数据主要存放地区：{dataRegion || "（正式招募前填写）"} · 保存期限：{retentionDays ? `${retentionDays} 天` : "（正式招募前填写）"}。请以研究负责人审核通过的完整参与说明为准。</p>
            <label><input type="checkbox" checked={adult} onChange={(event) => setAdult(event.target.checked)} /> 我已年满 18 岁</label>
            <label><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> 我已阅读说明，自愿参加</label>
          </div>
          <button className={styles.primaryButton} disabled={!consent || !adult || busy || (!preview && !inviteToken && !session)} onClick={() => void start()}>同意并继续 <span>↗</span></button>
          {!preview && !inviteToken && !session ? <p className={styles.help}>请通过研究者发给你的专属邀请链接进入。</p> : null}
        </section> : null}

        {ready && phase === "instructions" ? <section className={styles.centerCard}>
          <span className={styles.eyebrow}>开始之前</span><h1>你负责最后的决定</h1>
          <p className={styles.lead}>每道题分三步：了解情境 → 阅读证据 → 查看 AI 建议。AI 可能正确，也可能出错；请根据所见信息独立选择。</p>
          <div className={styles.stepGrid}><div><b>01</b><strong>看情境</strong><span>了解任务背景</span></div><div><b>02</b><strong>看证据</strong><span>留意三条关键信息</span></div><div><b>03</b><strong>做决定</strong><span>采纳 AI 或选另一方案</span></div></div>
          <button className={styles.primaryButton} onClick={() => setPhase("practice")}>先做一道练习 <span>→</span></button>
        </section> : null}

        {ready && phase === "practice" ? <section className={styles.centerCard}>
          <span className={styles.eyebrow}>练习 · 不计入正式题目</span><h1>先熟悉两个按钮</h1>
          <p className={styles.lead}>模拟情境：天气良好，一架无人机可继续原航线。AI 建议“继续原航线”。如果你想采纳 AI，应该点击哪一个？</p>
          <div className={styles.choiceGrid}><button className={styles.choiceButton} onClick={() => setPracticeChoice("follow")}>采纳 AI：继续原航线</button><button className={styles.choiceButton} onClick={() => setPracticeChoice("other")}>选择另一方案：暂停飞行</button></div>
          {practiceChoice ? <p className={practiceChoice === "follow" ? styles.success : styles.errorInline} role="status">{practiceChoice === "follow" ? "正确。采纳 AI 表示选择 AI 推荐的行动。" : "这个按钮代表不采纳 AI。请试着点击“采纳 AI”。"}</p> : null}
          <button className={styles.primaryButton} disabled={practiceChoice !== "follow" || busy} onClick={() => void beginTrial()}>开始正式任务 <span>→</span></button>
        </section> : null}

        {ready && phase === "trial" && trial ? <div className={styles.workspace}>
          <div className={styles.workspaceHeader}><div><span className={styles.eyebrow}>决策任务 {String(trialIndex + 1).padStart(2, "0")} / 12</span><h1>{trial.title}</h1><p>{trial.category} · 模拟场景</p></div><div className={styles.taskCount}>{String(trialIndex + 1).padStart(2, "0")}<span>/ 12</span></div></div>
          <div className={styles.stageTrack}><span className={stage === "situation" ? styles.stageActive : ""}>01 情境</span><span className={stage === "evidence" ? styles.stageActive : ""}>02 证据</span><span className={stage === "recommendation" ? styles.stageActive : ""}>03 协作决策</span></div>
          <div className={styles.workspaceGrid}>
            <article className={styles.missionCard}>
              <div className={styles.cardLabel}><span>◈</span> 任务简报</div>
              <h2>你正在负责这项任务</h2><p className={styles.situationText}>{trial.situation}</p>
              {stage !== "situation" ? <div className={styles.evidenceBlock}><h3>现场证据</h3>{trial.evidence.map((item, index) => <div className={styles.evidenceRow} key={item}><b>0{index + 1}</b><span>{item}</span></div>)}</div> : <div className={styles.lockedPanel}><span>⌁</span> 下一步将展示现场证据</div>}
              {stage === "situation" || stage === "evidence" ? <button className={styles.primaryButton} disabled={busy} onClick={() => void advanceStage()}>{stage === "situation" ? "查看现场证据" : "查看 AI 建议"} <span>→</span></button> : null}
            </article>
            <aside className={styles.agentCard} aria-label="AI 协作界面">
              <div className={styles.agentHeader}><AgentAvatar condition={condition} /><div><strong>{agent.name}</strong><span>{agent.role}</span></div><span className={styles.agentStatus}>在线</span></div>
              {stage !== "recommendation" ? <div className={styles.agentWaiting}><span className={styles.pulse}>✳</span><p>{stage === "situation" ? agent.situationPrompt : agent.evidencePrompt}</p><small>建议会在下一步出现</small></div> : <div className={styles.agentMessage}>
                <span className={styles.messageTime}>任务建议 · 已就绪</span>
                <p className={styles.agentIntro}>{agent.intro}</p>
                <span className={styles.messageLabel}>{agent.lead}</span>
                <strong className={styles.recommendation}>{recommended}</strong>
                <div className={styles.reason}><span>{agent.note}</span><p>{trial.reason}</p></div>
              </div>}
            </aside>
          </div>
          {stage === "recommendation" ? <section className={styles.decisionBar} aria-label="作出决定"><div><span className={styles.eyebrow}>轮到你决策</span><h2>你会选择哪一个方案？</h2><p>请根据证据判断，不必总是同意 AI。</p></div><div className={styles.decisionChoices}><button disabled={busy} className={styles.followButton} onClick={() => void decide("follow")}><small>采纳 AI 建议</small><strong>{recommended}</strong><span>↗</span></button><button disabled={busy} className={styles.otherButton} onClick={() => void decide("other")}><small>选择另一方案</small><strong>{opposite}</strong><span>→</span></button></div></section> : null}
        </div> : null}

        {ready && phase === "survey" ? <section className={styles.centerCard}>
          <span className={styles.eyebrow}>最后一步 · 体验问卷</span><h1>刚才的协作体验如何？</h1><p className={styles.lead}>请按真实感受评分。1 表示非常不同意，7 表示非常同意。</p>
          <div className={styles.surveyList}>{PILOT_SURVEY.map((item, index) => <fieldset key={item.id} className={styles.surveyQuestion}><legend><b>{String(index + 1).padStart(2, "0")}</b>{item.text}</legend><div className={styles.ratingRow}><span>不同意</span>{[1, 2, 3, 4, 5, 6, 7].map((value) => <label key={value} className={answers[item.id] === value ? styles.ratingSelected : ""}><input type="radio" name={item.id} value={value} checked={answers[item.id] === value} onChange={() => setAnswers((previous) => ({ ...previous, [item.id]: value }))} /><span>{value}</span></label>)}<span>同意</span></div></fieldset>)}</div>
          <label className={styles.feedbackLabel}>还有哪里令人困惑？（选填）<textarea maxLength={500} value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="可以写下你对界面、情境或 AI 建议的感受…" /></label>
          <button className={styles.primaryButton} disabled={busy} onClick={() => void submitSurvey()}>提交问卷，完成研究 <span>✓</span></button>
        </section> : null}

        {ready && phase === "done" ? <section className={styles.centerCard}><span className={styles.doneMark}>✓</span><span className={styles.eyebrow}>已完成</span><h1>谢谢你参与这次试点</h1><p className={styles.lead}>{preview ? "这是不保存数据的界面预览。" : "你的 12 个决定与体验问卷已保存。"}AI 在模拟任务中并非总是正确；这项研究关注不同界面如何影响人与 AI 的协作判断。现在可以关闭页面。</p></section> : null}
        {ready && phase === "withdrawn" ? <section className={styles.centerCard}><h1>你已退出</h1><p className={styles.lead}>本次试点记录已删除。谢谢你花时间了解这项研究。</p></section> : null}

        <footer className={styles.footer}><span>Human–AI Trust Calibration Engine · 中文 pilot v1</span>{session && phase !== "withdrawn" ? <button disabled={busy} onClick={() => void withdraw()}>{phase === "done" ? "撤回并删除本次记录" : "退出并删除记录"}</button> : null}</footer>
      </div>
    </main>
  );
}
