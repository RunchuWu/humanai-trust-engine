export type PilotCondition = 1 | 2 | 3;
export type PilotStage = "situation" | "evidence" | "recommendation";
export type PilotChoice = "follow" | "other";

export interface PilotTrial {
  id: string;
  category: string;
  title: string;
  situation: string;
  evidence: [string, string, string];
  action: string;
  alternative: string;
  aiChoice: "action" | "alternative";
  reason: string;
}

export const PILOT_VERSION = "zh-pilot-v1";

// The same facts, recommendation, and core explanation are shown in all three
// conditions. The answer key lives in pilot-answer-key.ts and is never imported
// by the participant interface.
export const PILOT_TRIALS: PilotTrial[] = [
  {
    id: "ops_01", category: "无人机避险", title: "配送无人机与鸟群",
    situation: "你正在监督一架配送无人机。前方出现鸟群，侧风也正在增强。",
    evidence: ["无人机当前高度：30 米", "鸟群位于前方约 40 米、同一高度", "地图显示 15 米高度没有地面障碍"],
    action: "下降至 15 米", alternative: "保持当前高度", aiChoice: "action",
    reason: "下降可避开同高度的鸟群，并保持在已知障碍物上方。",
  },
  {
    id: "ops_02", category: "路径调度", title: "仓库无人机派送",
    situation: "一件医疗物资需要由无人机从仓库送出，西侧航线临时受限。",
    evidence: ["预计到达时电量：18%", "西侧航线仍处于临时限制时段", "小雨强度低于常规停飞阈值"],
    action: "立即从西侧航线派送", alternative: "等待航线限制解除", aiChoice: "action",
    reason: "雨量仍在允许范围内，西侧航线可能在抵达前解除限制。",
  },
  {
    id: "ops_03", category: "目标识别", title: "人行道旁的不明物体",
    situation: "傍晚，一辆自动驾驶接驳车检测到斑马线附近有一个轮廓不清的物体。",
    evidence: ["热成像信号与人体相符", "摄像头受到眩光干扰", "物体距离路缘约 1.5 米"],
    action: "按行人风险处理", alternative: "按静止物体处理", aiChoice: "alternative",
    reason: "画面受干扰，物体位置尚不能确认它会进入车辆行驶路径。",
  },
  {
    id: "ops_04", category: "车辆操作", title: "湿滑路口刹车",
    situation: "一辆自动驾驶接驳车接近湿滑路口，前车突然减速。",
    evidence: ["路面湿滑", "前车速度明显下降", "当前跟车间隔约 1.4 秒"],
    action: "刹车并等待", alternative: "减速后继续前行", aiChoice: "action",
    reason: "湿滑路面和较短的跟车间隔，使及时刹车风险更低。",
  },
  {
    id: "ops_05", category: "路径调度", title: "山区道路改道",
    situation: "一支地面车队考虑绕行北侧道路，以避开主路上的雾。",
    evidence: ["主路能见度正在改善", "北侧绕行会增加约 28 分钟", "绕行路段有陡坡和近期维护提醒"],
    action: "改走北侧道路", alternative: "继续走主路", aiChoice: "alternative",
    reason: "主路能见度正在改善，而绕行会增加时间和坡道路况风险。",
  },
  {
    id: "ops_06", category: "无人机避险", title: "施工吊车与无人机",
    situation: "一架配送无人机接近市区施工区，附近出现一台吊车。",
    evidence: ["吊臂估计高度：55 米", "无人机当前高度：42 米", "高楼之间的 GPS 定位误差风险升高"],
    action: "爬升至 60 米继续", alternative: "暂停并请求更新航线", aiChoice: "action",
    reason: "爬升至吊臂估计高度以上，可能恢复垂直安全距离。",
  },
  {
    id: "ops_07", category: "目标识别", title: "屋顶降落区检查",
    situation: "暴风雨后，一架无人机准备在屋顶平台降落。",
    evidence: ["摄像头看到较平整的平台", "激光雷达发现平台边缘有低矮杂物", "阵风仍高于常规降落上限"],
    action: "标记为可降落", alternative: "放弃此降落区", aiChoice: "alternative",
    reason: "杂物和阵风使平台不适合降落，即使画面看起来较空旷。",
  },
  {
    id: "ops_08", category: "车辆操作", title: "施工路段并线",
    situation: "一辆自动驾驶车辆接近封闭车道，邻道出现一个短暂空隙。",
    evidence: ["邻道车距约 1.1 秒", "车辆仍以较高速度行驶", "前方路锥缩窄可用车道"],
    action: "立即并入邻道", alternative: "刹车等待更大空隙", aiChoice: "alternative",
    reason: "当前速度和较短车距使立即并线的安全余量不足。",
  },
  {
    id: "ops_09", category: "路径调度", title: "无人机电量与紧急巡检",
    situation: "设施需要尽快派出 4 号无人机巡检，目的地附近的充电器已恢复使用。",
    evidence: ["当前电量：42%", "预计任务耗电：31%", "目的地充电器已确认可用"],
    action: "派出 4 号无人机", alternative: "等待电量更充足的无人机", aiChoice: "alternative",
    reason: "预计剩余电量较少，等待更充足的电量可降低任务中断风险。",
  },
  {
    id: "ops_10", category: "无人机避险", title: "楼宇间的侧风",
    situation: "一架测绘无人机接近两栋楼之间的狭窄航道，突然遇到侧风。",
    evidence: ["侧风从西侧吹来", "当前航线距离西侧建筑很近", "最新地图显示东侧航道畅通"],
    action: "将航线向东调整", alternative: "维持原航线", aiChoice: "action",
    reason: "向东调整可增加与建筑的距离，且地图未显示新障碍。",
  },
  {
    id: "ops_13", category: "路径调度", title: "港口渡轮航道",
    situation: "一架巡检无人机可以横穿渡轮航道，以缩短码头巡检路线。",
    evidence: ["渡轮预计 4 分钟后出发", "无人机预计 3.5 分钟完成穿越", "水面阵风正在增强"],
    action: "现在横穿渡轮航道", alternative: "等待渡轮通过", aiChoice: "action",
    reason: "预计穿越时间短于渡轮出发倒计时，因此或许能提前通过。",
  },
  {
    id: "ops_15", category: "目标识别", title: "电线还是阴影",
    situation: "一架测绘无人机在乡村电力走廊附近看到一条细线，可能与航线相交。",
    evidence: ["地图在该位置标有电线", "立体测距显示细线穿过航线", "阳光眩光降低了摄像头对比度"],
    action: "按电线风险处理", alternative: "按无害阴影处理", aiChoice: "alternative",
    reason: "摄像头对比度偏低，视觉画面未能清楚确认电线。",
  },
];

export const PILOT_ORDERS: Record<"A" | "B", string[]> = {
  A: PILOT_TRIALS.map((trial) => trial.id),
  B: [...PILOT_TRIALS].reverse().map((trial) => trial.id),
};

export const PILOT_AGENTS: Record<PilotCondition, {
  name: string;
  role: string;
  intro: string;
  lead: string;
  note: string;
  situationPrompt: string;
  evidencePrompt: string;
}> = {
  1: { name: "决策系统", role: "自动分析模块", intro: "系统已生成建议。", lead: "系统建议", note: "分析依据", situationPrompt: "任务情境已载入。", evidencePrompt: "证据已显示。" },
  2: { name: "智能助手", role: "任务协助界面", intro: "已整理当前信息，供你判断。", lead: "建议", note: "判断依据", situationPrompt: "请先了解当前任务。", evidencePrompt: "可以先浏览这三条证据。" },
  3: { name: "小航", role: "协作型任务助手", intro: "我留意到这一步的关键信息，我们一起看一下。", lead: "我建议", note: "我关注的依据", situationPrompt: "我先陪你看清这项任务，再一起判断。", evidencePrompt: "我想提醒你先看看这三条证据，再决定是否采纳我的建议。" },
};

export const PILOT_SURVEY = [
  { id: "humanlike_1", text: "这个系统给我的感觉像一个有个性的助手。" },
  { id: "humanlike_2", text: "与这个系统互动时，我感到它的表达接近人类。" },
  { id: "warmth_1", text: "这个系统的表达让我感到温暖。" },
  { id: "warmth_2", text: "这个系统的交流方式让我感到被支持。" },
  { id: "agency_1", text: "这个系统会主动提醒我关注重要信息。" },
  { id: "agency_2", text: "这个系统看起来会积极参与决策过程。" },
  { id: "clarity", text: "我清楚知道每道题要如何作答。" },
  { id: "trust", text: "我整体上愿意参考这个系统的建议。" },
] as const;
