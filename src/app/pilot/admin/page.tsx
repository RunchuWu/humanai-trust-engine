"use client";

import { useState } from "react";
import Link from "next/link";

import styles from "./admin.module.css";

type Link = { condition: 1 | 2 | 3; order: "A" | "B"; url: string };
type Participant = { participant_id: string; condition: number; status: string; answered: number; accuracy: number | null; mean_decision_time_ms: number | null; mean_thinking_time_ms: number | null };

function percentage(value: number | null) { return value === null ? "—" : `${Math.round(value * 100)}%`; }
function seconds(value: number | null) { return value === null ? "—" : `${(value / 1000).toFixed(1)} 秒`; }

export default function PilotAdminPage() {
  const [key, setKey] = useState("");
  const [perGroup, setPerGroup] = useState(10);
  const [links, setLinks] = useState<Link[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function request(url: string, options?: RequestInit) {
    const response = await fetch(url, { ...options, headers: { Authorization: `Bearer ${key}`, ...(options?.headers ?? {}) }, cache: "no-store" });
    if (!response.ok) throw new Error(response.status === 401 ? "研究者密钥不正确。" : `请求失败（${response.status}）。`);
    return response;
  }

  async function generate() {
    setBusy(true); setMessage("");
    try {
      const response = await request("/api/pilot/admin/invites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ perGroup }) });
      const data = await response.json() as { links: Link[] };
      setLinks(data.links);
      setMessage(`已生成 ${data.links.length} 条一次性链接。请立即下载并保存；服务端仅保存哈希，无法再次显示原链接。`);
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "生成失败。"); }
    finally { setBusy(false); }
  }

  async function refresh() {
    setBusy(true); setMessage("");
    try {
      const response = await request("/api/pilot/admin/export?kind=json");
      const data = await response.json() as { participants: Participant[] };
      setParticipants(data.participants);
      setMessage("已读取最新数据。");
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "读取失败。"); }
    finally { setBusy(false); }
  }

  async function download(kind: "participants" | "decisions" | "events" | "json") {
    setBusy(true); setMessage("");
    try {
      const response = await request(`/api/pilot/admin/export?kind=${kind}`);
      const blob = kind === "json" ? await response.blob() : new Blob(["\uFEFF", await response.text()], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `pilot-${kind}.${kind === "json" ? "json" : "csv"}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "导出失败。"); }
    finally { setBusy(false); }
  }

  function saveLinks() {
    const csv = `distribution_order,condition,order,url\n${links.map((link, index) => `${index + 1},${link.condition},${link.order},${link.url}`).join("\n")}\n`;
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "pilot-invitation-links.csv"; anchor.click();
    URL.revokeObjectURL(url);
  }

  return <main className={styles.page}>
    <div className={styles.shell}>
      <header><span>RESEARCHER CONSOLE</span><h1>中文三界面 pilot</h1><p>生成一次性受试者链接，检查完成情况并导出研究数据。</p></header>
      <section className={styles.card}><h2>研究者密钥</h2><label>在服务器设置的 PILOT_ADMIN_KEY<input type="password" autoComplete="off" value={key} onChange={(event) => setKey(event.target.value)} placeholder="不会保存在浏览器中" /></label></section>
      <section className={styles.card}><h2>邀请链接</h2><p>每组生成相同数量的邀请码；下载文件按随机顺序列出，便于依次分发。每人只发一条链接。</p><div className={styles.row}><label>每组人数<input type="number" min={1} max={30} value={perGroup} onChange={(event) => setPerGroup(Number(event.target.value))} /></label><button disabled={!key || busy} onClick={() => void generate()}>生成三组链接</button>{links.length ? <button className={styles.secondary} onClick={saveLinks}>下载邀请链接 CSV</button> : null}</div>
        {links.length ? <div className={styles.linkList}>{links.map((link, index) => <div key={link.url}><b>{String(index + 1).padStart(2, "0")}</b><span>界面 {link.condition} · 顺序 {link.order}</span><input readOnly value={link.url} aria-label={`第 ${index + 1} 条邀请链接`} /><button className={styles.secondary} onClick={() => void navigator.clipboard.writeText(link.url)}>复制</button></div>)}</div> : null}
      </section>
      <section className={styles.card}><h2>数据与分析导出</h2><p>答案逐题保存；正确率由服务器答案表计算。总决策时间从情境展示到作答（扣除阶段记录的网络等待），思考时间从 AI 建议出现到点击。参与者汇总还包含跟随率、过度信任、低度信任、校准差和问卷评分。</p><div className={styles.row}><button disabled={!key || busy} onClick={() => void refresh()}>刷新概览</button><button disabled={!key || busy} className={styles.secondary} onClick={() => void download("participants")}>参与者 CSV</button><button disabled={!key || busy} className={styles.secondary} onClick={() => void download("decisions")}>逐题 CSV</button><button disabled={!key || busy} className={styles.secondary} onClick={() => void download("events")}>阶段事件 CSV</button><button disabled={!key || busy} className={styles.secondary} onClick={() => void download("json")}>完整 JSON</button></div>
        {participants.length ? <div className={styles.stats}><div><b>{participants.length}</b><span>邀请码已生成</span></div><div><b>{participants.filter((item) => item.status === "complete").length}</b><span>完成会话</span></div><div><b>{participants.filter((item) => item.answered > 0).length}</b><span>已有答题</span></div></div> : null}
        {participants.length ? <div className={styles.tableWrap}><table className={styles.participantTable}><thead><tr><th>匿名编号</th><th>界面</th><th>状态</th><th>已答</th><th>正确率</th><th>平均决策时间</th><th>平均思考时间</th></tr></thead><tbody>{participants.map((item) => <tr key={item.participant_id}><td>{item.participant_id}</td><td>{item.condition}</td><td>{item.status === "complete" ? "已完成" : item.status === "active" ? "进行中" : "未开始"}</td><td>{item.answered}/12</td><td>{percentage(item.accuracy)}</td><td>{seconds(item.mean_decision_time_ms)}</td><td>{seconds(item.mean_thinking_time_ms)}</td></tr>)}</tbody></table></div> : null}
      </section>
      {message ? <p className={styles.message} role="status">{message}</p> : null}
      <p className={styles.note}>外部招募前仍须完成研究材料审核、知情同意审批、中国大陆访问测试与数据所在地确认。界面预览：<Link href="/pilot/1?preview=1">1</Link> · <Link href="/pilot/2?preview=1">2</Link> · <Link href="/pilot/3?preview=1">3</Link>。</p>
    </div>
  </main>;
}
