# 开放判断题：供审阅的材料与测量方案

状态：原始设计方案。用户后续批准加入系统，四道开放题已作为新版第一部分实现；
第二部分为八道数值题。当前实现与操作说明见 [两部分实验手册](research-two-part.md)。
本文件保留最初题目和测量设计供追溯；英文为参与者材料，中文为研究说明。
实际实现使用字符上限、单独的可跳过反思步骤，并固定开放题在前、数值题在后。
A/B 在每个会话内随机分配为各两题，而非预生成的跨参与者平衡表；跨组题目级严格平衡和
文本人工编码尚未实现。以下顺序平衡等建议不代表当前运行时行为。
以下案例和 AI 文本均为本项目新编材料，尚未经过真人预试或独立语义审核。

## 研究问题与任务形式

研究问题：相同的价值权衡意见，通过不同 AI 界面呈现时，参与者如何回应？
主要数据是前后两段判断与理由，以及参与者对 AI 论点的回应。
立场改变、考虑反方、采纳理由、信任评价分别记录；不将它们合成为“信任百分比”。
没有标准正确答案，也不判定哪一种道德立场更好。

建议采用四个日常情境：公平、隐私、责任、资源分配。每题均允许条件式答案、
第三种方案，以及“信息不足”。给定事实保持一致，AI 只能对这些事实作价值权衡，
不能引入新事实、虚构政策、外部权威或与参与者的共同经历。

## 四道完整样题

### J01 · 小组贡献与照顾责任（公平）

**Participant scenario**

> Four students are finishing a group project. One member unexpectedly had to care
> for a family member during the final week. They told the group as soon as they
> could and completed an earlier research section, but did not finish their agreed
> final section. The other three members completed that section before the deadline.
> The course allows an individual contribution adjustment but does not require one.
> The group must now recommend whether this member should receive a lower mark.

**Open question**

> What should the group recommend, and why? Describe the considerations that matter
> most to you. You may propose conditions or an alternative approach.

**辅助立场命题**

> The group should recommend a lower mark for this member.

**AI perspective A — favour an adjustment**

> I would recommend a limited contribution adjustment. The unexpected caring
> responsibility deserves consideration, and the earlier research contribution
> should still count. However, the other members took on unfinished work to meet
> the deadline. A modest adjustment could recognise that additional contribution
> without treating the absence as misconduct. The group should explain its
> reasoning and give the member a chance to respond.

**AI perspective B — favour no adjustment**

> I would recommend no contribution adjustment in this case. The member contributed
> earlier, communicated the unexpected caring responsibility, and did not simply
> abandon the project. The extra work carried by the others should still be
> acknowledged. Maintaining the shared mark could recognise that a group sometimes
> absorbs an exceptional disruption. The group should explain its reasoning and
> discuss how to handle similar situations in future.

**研究观察点**：贡献公平、对不可控情况的体谅、程序公平；是否改变扣分决定，
或者仅增加沟通、说明、补救等条件。追加条件可能是有意义的回应，即使立场档位未变。

### J02 · 公共区域摄像头（隐私）

**Participant scenario**

> Several parcels have gone missing from an apartment building's shared lobby.
> Residents are considering a camera aimed only at the parcel shelf, away from
> apartment doors. Under the proposal, recordings would be deleted after seven
> days and could be viewed by two resident representatives after a reported loss.
> The camera's effect on parcel losses is unknown. Some residents support the
> proposal; others do not want their collections recorded. A locked parcel cabinet
> is another option, but it would leave less space in the lobby.

**Open question**

> What should the residents do, and why? Explain which trade-offs or conditions
> matter to you. You may suggest another approach.

**辅助立场命题**

> The residents should install the camera under the proposed rules.

**AI perspective A — favour installation**

> I would support installing the camera under the proposed rules, with residents
> reviewing the arrangement after a trial period. Its narrow view, short retention
> period and restricted access place limits on recording. The privacy concerns
> still matter, and fewer parcel losses are not guaranteed. A review would let
> residents reconsider the arrangement if its practical value does not justify
> its privacy cost.

**AI perspective B — favour an alternative first**

> I would try the locked parcel cabinet before installing the camera. The proposed
> recording limits address some concerns, but people collecting parcels would
> still be recorded even if they object. The cabinet uses shared space, so that
> cost needs discussion as well. Starting with an approach that does not record
> residents could address the problem while leaving the camera proposal open
> for reconsideration.

**研究观察点**：安全与隐私、同意、比例原则、替代措施。
不把“摄像头一定有效”当作事实；区分同意安装、附条件同意、先试替代措施和拒绝安装。

### J03 · 借来的相机意外受损（责任）

**Participant scenario**

> You borrowed a friend's camera for a day trip and used it as agreed. Rain was
> heavier than forecast, and water entered the bag despite the usual precautions.
> The camera now needs repair. Neither of you believes the damage was deliberate
> or that you ignored an agreed precaution. You did not discuss how accidental
> damage would be handled before the trip. Either of you could afford the repair,
> although it would be an unwelcome expense for both.

**Open question**

> How should you and your friend handle the repair cost, and why? Explain what
> responsibility each person has. You may suggest a shared or conditional solution.

**辅助立场命题**

> The borrower should offer to cover the full repair cost.

**AI perspective A — favour the borrower paying**

> I would offer to cover the repair cost as the borrower. The damage was accidental,
> and taking the usual precautions matters. Still, the camera was being used for
> the borrower's trip when it was damaged. Offering to restore it could recognise
> the owner's generosity and avoid leaving them with the expense of lending it.
> The friends could still agree on a different arrangement after discussing it.

**AI perspective B — favour sharing the cost**

> I would propose sharing the repair cost. The borrower used the camera as agreed
> and took the usual precautions, so treating them as fully responsible may give
> too little weight to an unforeseen accident. The owner should not simply be
> left with the expense either. Sharing the cost could recognise both the
> borrower's use and the uncertainty both friends left unresolved before the trip.

**研究观察点**：借用者责任、不可控意外、物主承担的风险、关系互惠。
这里讨论双方认为合理的处理，不询问法律义务；不能把任何一方的道德立场判为正确。
最终方案可以是全额承担、共同分担、先沟通或提出其他补救。

### J04 · 唯一的黄金时段（资源分配）

**Participant scenario**

> A community centre has one popular evening slot available next month. An
> established club has regularly filled its sessions and has used that slot before.
> A newly formed club has not used the centre yet and wants the same slot for an
> introductory session. Both clubs can use a less convenient weekend morning slot,
> but neither knows how attendance would change. There is no existing rule giving
> either club priority. The centre must decide how to allocate the evening slot.

**Open question**

> How should the centre allocate the evening slot, and why? Explain the principles
> you would use. You may propose a process rather than choosing a club directly.

**辅助立场命题**

> The centre should give the evening slot to the new club this time.

**AI perspective A — favour the new club**

> I would give the new club the evening slot this time. The established club has
> already had access to it, while the new club has not had a chance to build an
> audience at the centre. Lower attendance is possible, and regular users would
> lose a preferred slot. Still, offering one opportunity could recognise access
> for new groups alongside the interests of existing ones.

**AI perspective B — favour the established club**

> I would give the established club the evening slot this time. Its history of
> filled sessions provides a concrete basis for expecting the space to be used.
> This may make it harder for a new group to build an audience, so future access
> should also be discussed. For this allocation, continuity for existing users
> is a reasonable consideration alongside opportunities for new groups.

**研究观察点**：使用效率、平等机会、历史权利、公平程序。
抽签、轮换、公开标准等第三种方案保留为独立回应；不能强行归为 A 或 B。

## 单题流程与参与者提示

1. **读情境，独立回应**。写 2–4 句：`What should happen, and why?`
   不要求罗列所有理由，也不限制必须选择某个方案。文本建议上限 120 个英文单词，
   实际限制及最低作答要求在预试后确定。
2. **辅助记录立场与自信度**。对该题固定命题选择七档文字：强烈反对、反对、
   略反对、既不支持也不反对、略支持、支持、强烈支持。另设“暂时无法判断”，
   不与中立混为一谈。自信度问的是“对自己所持判断有多大把握”，不问答对概率。
3. **显示一段预写 AI 观点**。A/B 内容预先分配，提交初始回应后才展示。
   不针对参与者自由文本临时生成反驳，也不默认让 AI 总是持相反立场。
4. **最终回应**。仍问 `What should happen, and why?`，再次填写立场与自信度。
   初始回应可以展开查看；最终文本不预填 AI 文本或初始答案。
5. **简短反思**。最终回应保存后，再问：
   `Which parts of the AI's reasoning, if any, did you accept, reject, or qualify?`
   防止在最终判断前要求参与者“找出 AI 如何影响了自己”。

每题约 3–5 分钟仅作为界面负担预算，实际用时须预试；先测试两题的可理解性，再
决定四题能否放在同一场。开放模块的顺序、时间和问卷应独立冻结。如果将来与数值
模块共同运行，需处理模块先后顺序和疲劳效应，不能直接与目前六题 pilot 混合分析。

## 测量：以文字为主，立场选择为辅

| 记录 | 提供的证据 | 不作的解释 |
| --- | --- | --- |
| 初始与最终文本 | 决定、条件、理由和价值优先次序怎样变化 | 文本相似度不是信任程度 |
| 前后立场类别 | 对固定命题的支持增强、减弱、不变或无法比较 | 序数档位不计算数值 WOA 或“靠拢百分比” |
| 前后判断自信度 | 改变判断与改变把握程度可分开观察 | 自信上升不自动等于判断质量改善 |
| 对 AI 理由的反思 | 自报接受、拒绝和附条件采纳哪些论点 | 自报影响不等于已证实的因果影响 |
| 展示与作答时间 | 阅读及回应耗时 | 耗时不直接代表投入、信任或认知负荷 |
| 结束体验项目 | 对界面的温暖、亲近、可信、尊重自主性的感受 | 临时编写项目不冒充已验证量表 |

立场方向的计算仅作分类：

- A 支持固定命题；B 反对该命题。记录参与者支持度是否沿该意见方向改变。
- 最初已同意 AI 的参与者，进一步同意属于“强化原有立场”；最初不同意者可以
  “朝 AI 方向移动但仍不同意”。二者分开报告。
- 不能推断某段自然语言 AI 意见精确位于七档中的哪一档，因此不计算与 AI 的
  数值距离，也不将类别间隔视为相等。
- “暂时无法判断”和不能映射到单一命题的第三种方案单独记录，不能当零变化。
- 可以报告“多少参与者的立场类别沿 AI 意见方向变化”的比例，并写清分母。
  这个群体比例不等于单个参与者改变了多少百分比。

### 拟议文本编码表

在看到实验组差异前冻结编码规则。可同时出现多个编码；不要用单一高低分吞掉差异。

| 编码 | 判定标准 |
| --- | --- |
| 结论维持 / 结论改变 / 条件化 / 第三方案 / 不明确 | 比较两段文本中的实际建议行动；不是只比较关键词 |
| AI 一致的新理由 | 最终文本出现与 AI 对应、初始文本未表达的理由；标注具体片段 |
| 明确接受 | 反思中明确表示接受某条 AI 理由；与上一项分别保留 |
| 理由反驳 | 明确说明某条 AI 理由为何不适用于本情境 |
| 条件式采纳 | 给出只有在某个条件成立时才接受意见的说明 |
| 价值重新排序 | 如原先优先效率，最终优先机会公平，并能找到文本依据 |
| 无法判断 | 文本过短、矛盾或不能可靠归类；不默认为拒绝 AI |

例：参与者先写“应该扣分，因为其他人承担了额外工作”；看 B 后写“仍应略微扣分，
但应先听取本人说明，并把早期研究算入贡献”。这可以是结论大体维持＋增加程序条件。
不能仅因仍支持扣分而断言 AI 没有影响，也不能仅因出现相同词语而断言接受了 B。

第一轮小样本材料由两位编码者独立编码，尽可能不见界面组别；编码者可以看到
初始回应、最终回应和该参与者实际看到的 AI 核心论点。先计算一致性、检查分歧，
再按记录的规则协商；保留独立编码和裁决结果。文字有时会自行透露界面特征，
因此不声称完全盲法。AI 可以协助检索候选片段，不能作为唯一最终编码者。

### 与信任相关的体验项目草案

以下是待预试的独立 1–7 项目，不计算未经验证的总分。现有拟人感、温暖、亲近和
清晰度项目可另行保留；关于数值准确性的 capability/reliability 项目需改写。

- `I would be willing to consult this assistant on a similar judgment.`
- `The assistant's reasoning was worth considering, even where I disagreed.`
- `I felt free to disagree with the assistant.`
- `I felt pressure to accept the assistant's view.`

最后两项用于观察自主感与压力，不能简单反向计分后称为信任。
记录社会性界面可能提高认同、降低戒备或提高讨论意愿等不同解释，避免把所有变化
都归为信任。没有立场改变的人也可能认真信任并考虑 AI 的分析后作出不同决定。

## 设计控制和分析边界

- 初版采用三套固定界面，certainty 保持一致。每位参与者只见一套界面。
- 同一题、同一 A/B 核心观点在各界面组使用完全相同的事实、论点和理由。
  Tone 与 Framing 只改变预先审核的表达片段；不增加新论点或额外赞美施压。
- 四题 A/B 采用预生成分配表，每人两段 A、两段 B；A/B 与题目、界面独立平衡。
  顺序也预先平衡。材料版本、观点版本、实际展示文本全部冻结。
- 分别分析最初与 AI 一致、不一致和未形成判断的参与者；考虑不同议题的初始
  立场强度及天花板效应。重复四题不能被当作四个独立参与者。
- 三种界面之间的随机比较可以估计界面呈现差异。若要判断“AI 本身是否导致改变”，
  需要额外的无 AI / 等时重读对照；单组前后变化也可能来自重复思考。
- 正式研究前预先指定主要结果。建议文本编码是探索性结果，立场转换分布与
  单独信任项目一起报告；不要看到结果后才挑选最明显的指标。
- 没有正确答案、无 accuracy、无 error reduction；这些字段不能沿用数值题的定义。

## 研究依据及适用范围

既有实验区分了“对相同信息来源的感知”与“信息内容本身”，并分别观察对反方观点的
开放程度与态度变化。这支持本方案将核心论点固定、把开放程度和立场变化拆开记录
的设计思路，但不验证本项目这四道新题及编码表。
参见 [Lu 等，2025，Scientific Reports](https://www.nature.com/articles/s41598-025-00791-z)。

另有 AI 消息研究采用前后态度测量和对照条件；我们借鉴其基线与对照思路，不沿用
其政治题材，也不将其效果量用作本任务的预期效果。
参见 [LLM-generated messages can persuade humans on policy issues，2025](https://www.nature.com/articles/s41467-025-61345-5)。

## 原方案提出的数据字段

建议采用新的 `open_judgment` 工作流，保留 `item_id`、`scenario_version`、`viewpoint_id`、
`initial_text`、`final_text`、`initial_stance`、`final_stance`、两次自信度、`reflection_text`、
展示快照和时间；文本编码应另存编码者、规则版本、证据片段与裁决记录。
当前实现采用 `two-part-v1` 工作流与 `trial_type=open_judgment` 标记，新增上述前后回应、
立场、观点、反思及展示记录。精确字段见两部分实验手册；文本人工编码另行开展。
