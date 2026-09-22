# English spectrum research tool (V2)

> Historical V2 reference. New studies use the [V3 prediction workflow](research-prediction-v3.md). Existing frozen V2 links retain this behavior; use `test:constraint:materials` and `test:constraint:e2e` for its regression tests.

The V2 experience uses 16 everyday constraint decisions, one practice,
six five-level cues, three independent interface appearances, and six final
ratings. `/task?debug=1` opens the researcher workspace; `/task` alone is a
non-recording participant demo. The operations experiment is retained at
`/task?legacy=1` and `/task?legacy=1&debug=1`.

## Run and use

Start the app with `RESEARCH_ADMIN_KEY` set to a private researcher key. Use
`npm run dev`, then open the researcher workspace. No key is needed for preview.
The key is held only in UI memory and sent as a bearer header for researcher
requests. It is separate from `PILOT_ADMIN_KEY`.

1. Choose one of the three fixed groups to edit. Each group has its own six
   sliders and appearance. Applying Cold, Neutral, or Friendly updates only the
   selected group; any individual edit marks its label Custom.
2. Use the same-material preview, stage selector, and Compare presets tab.
   Preview interactions never create sessions, exposures, decisions, or ratings.
3. Optionally enable the separate user-set entry. Select a starting profile and
   permitted dimensions; by default the first five are adjustable and Confidence
   is locked. Appearance is always fixed for participants.
4. Set the common trial order and edit the six questionnaire statements if needed.
   Stable item IDs and constructs cannot be changed by imports.
5. Save a draft or freeze a new version. Every save creates a new immutable
   record; freezing never overwrites a previous record. The saved-version selector
   loads server-side drafts and frozen records. JSON import creates a new draft.
6. Frozen versions have a randomized fixed-group participant link and, when
   enabled, a separate user-set link. The fixed entry samples the three profiles
   with equal probability; it does not promise equal group counts. Every browser
   retains its assigned session for that study. The user-set entry is not mixed
   into this random assignment.
7. Open Data & exports with the researcher key to inspect sessions and exposure
   snapshots or download V2 JSON/CSV. Filter by the frozen study UUID, or leave
   blank to include all versions. Materials answer/review notes are key-protected.

A published participant completes consent and comprehension, optional setup,
practice, 16 staged decisions, six 1–7 ratings, and debrief. Confirmed settings are
locked for the whole session. Refresh restores the saved stage; responses cannot
be revised after saving. Save failures leave the task on the current step and
show a retry action. No name, email, real conversation, or external model is used.

## Cues and material contract

The canonical bank is `data/stimuli/everyday-en-v1.json`. Runtime public material
is produced by an explicit allowlist in `src/lib/research/materials.ts`; answers,
constraint-check results, and review notes stay server-side. Frozen study records
include their own complete material snapshot, including the expression catalog.
Future source edits therefore do not change earlier study links or sessions.

Levels are ordinal material IDs: 0, 25, 50, 75, 100. Zero is a valid low cue, not
an off switch. They are not validated psychological scores.

| Cue | Five anchors | Visible output |
| --- | --- | --- |
| Name | Assistant / AI Assistant / Alex / Sarah / Your Companion | Sender identity and recommendation attribution |
| Tone | Report-like / polite-distant / natural / warm / friendly | Assessment introduction |
| Avatar | System / abstract / silhouette / illustration / friendly expression | Fixed-size, versioned inline SVG; same illustrated identity at 75 and 100 |
| Personality | Task-focused / methodical / calm / supportive / encouraging | Decision-support stance, beyond an identity label |
| Framing | Information tool / task assistant / decision assistant / partner / companion | Role, welcome, all three stage prompts, closing |
| Confidence | Tentative / leaning / clear / confident / firm | Independent certainty statement |

Every item references five catalog entries for each textual cue. The resolver
selects these fixed fragments and preserves the core explanation verbatim. The
shared catalog is stored once; it is not duplicated into 17 independent copies.
This produces inspectable combinations rather than live generated text. The
same resolver and `StimulusView` serve researcher preview and participant tasks.

Cold/Neutral/Friendly presets place the first five dimensions at 0/50/100, hold
Confidence at 50, and select their corresponding appearance. Appearance can be
changed independently: it controls borders, corner radius, message background,
and accent tokens, while content order and action locations remain consistent.
The new tool always displays the core explanation and has no numeric-confidence
manipulation. Legacy switches retain their previous semantics only in legacy mode.

### Dataset design and review

Four categories contain four formal items each: scheduling, shopping, travel, and
activities. All prices, dates, capacities and travel times are fixed task data.
Each item presents one proposed option and three explicit constraints; all must
be satisfied. “Use this option” maps to `proceed`; “Do not use this option” maps
to `reject`. A participant's accept/override decision follows or opposes the
*AI recommendation*, not the proposed option directly.

The 16 items balance ground truth, AI recommendation and AI correctness 8/8,
with four false-proceed and four false-reject suggestions. Each category contains
one item in each truth/recommendation combination. Wrong suggestions deliberately
omit a binding constraint or introduce an irrelevant preference. Practice is
excluded from counts and analysis.

Each record contains its answer explanation, three constraint checks, review
status, and notes. All new material is marked pending: structural checks and
manual authoring do not establish independent research approval. In particular,
the proposed name ordering, perceived personality/relationship separation, avatar
identity effects and certainty gradient still need participant validation.

Recommendation prose (framing + tone + core reason + certainty + personality)
has a 50 / 47 / 48 word count in the three preset practice messages. The automated
check limits the between-preset spread to ten words; all formal messages share
the same fixed fragment differences. Semantic coherence still requires review.

To revise materials, edit the canonical JSON and run `npm run test:research:materials`.
Changes should get a new dataset version for new experimental materials; add the
version to the runtime contract rather than relabeling historical records. Before
formal use, review the exact exported bank and run a small manipulation pilot.

## API, storage, and event semantics

| Endpoint | Contract |
| --- | --- |
| `GET /api/research/studies` | Key required; list saved drafts and frozen versions |
| `POST /api/research/studies` | Key required; `{config, status, parentId?}` creates a new version |
| `GET /api/research/studies?id=…` | Frozen configuration plus sanitized public material snapshot |
| `POST /api/research/session` | `{studyId, kind, …}`: start, lock, practice, advance, shown, decision, survey |
| `GET /api/research/session?studyId=…` | Restore the current browser's session; HttpOnly cookie required |
| `POST /api/research/events` | Same session mutation contract, used to acknowledge displayed stages |
| `GET /api/research/materials` | Key required; current full bank with answers/review notes |
| `GET /api/research/export?format=json\|csv&studyId=…` | Key required; version-filtered data |

Session cookies are isolated by frozen study ID and contain a random token. The
store keeps only its hash. Start requests carry a random retry token so losing
the first response/cookie does not create a second session on retry. The server
validates allowed setup changes, stage sequence, trial order, and survey ranges;
it derives scores and actual configuration independently of client-supplied
score fields. Duplicate exposures/decisions/ratings are idempotent.

English V2 uses an atomic JSON file and a cross-process directory lock under
`data/runs/research-v2/research.json`. `RESEARCH_DATA_DIR` overrides this directory,
which is useful for isolated tests. This retains the English tool's filesystem
storage model: run collection on a host with a persistent writable disk. A
serverless deployment with ephemeral/read-only local storage is not a durable
collection backend.

JSON exports contain frozen configurations/materials, sanitized sessions, and
all events, so the exact display can be reconstructed. CSV flattens six cue
levels and includes the complete resolved snapshot on exposure and decision
rows. Legacy logs and validators retain their original schemas and files.

V2 event types: `session_started`, `configuration_locked`, `task_shown`,
`stage_shown`, `decision`, and `manipulation_check`. Every event identifies its
study/config/material version, profile, configuration source, session and six
cue levels. Each first recommendation exposure stores the resolved messages,
identity, avatar version, appearance and an `exposure_id`; decisions reference it.

- `timestamp_ms`: server receipt/commit time.
- `client_shown_at_ms`: first displayed stage time reported by the browser,
  accepted within five minutes of server time; otherwise server time is used.
- `latency_ms`: decision time minus the first situation display time, preserving
  the legacy whole-trial wall-clock interpretation.
- `thinking_time_ms`: decision time minus the first recommendation display time.
- Refresh does not reset persisted exposure timestamps. Background-tab time is
  included. Client display timestamps measure presentation, not tamper-proof time.
- Practice is not included in behavioral events. Six final ratings are separate
  `manipulation_check` events with frozen wording, stable IDs and a 1–7 scale.

## Verification

Run the static checks:

```sh
npm run lint
npx tsc --noEmit
npm run test:research:materials
npm run validate:stimuli
npm run check:docs
npm run build
```

Start a localhost-only QA server using a test key and a temporary
`RESEARCH_DATA_DIR`. Then run `npm run test:research:e2e` with the same key and
`RESEARCH_BASE_URL`. The suite creates test study versions and full fixed/user-set
sessions, checks concurrent duplicates, server scoring, answer privacy, setup
locks, version isolation, restoration, and export consistency. Keep these data
separate from participants.

For browser checks, launch an isolated headless Chrome with a debugging endpoint,
set `CHROME_DEBUG_URL` (default localhost port 9223), and run
`npm run test:research:browser`. It uses the Chrome DevTools Protocol with no new
runtime package. It tests keyboard/mouse/touch sliders, independent appearance,
preview isolation, the freeze/link flow, a complete browser session, refresh,
simulated save failure and retry, custom setup and mobile overflow.
`RESEARCH_SCREENSHOT_DIR` sets the screenshot destination.

Validate either downloaded V2 export using:

```sh
npm run validate:research-export -- --file /tmp/research-v2-export.json
```

Use the existing `validate:export` and synthetic pilot QA for legacy regression
coverage. No deploy, external recruitment or participant
perception study is performed by these automated tests.

### Completed implementation checks

The implementation passed lint, TypeScript, production build, documentation links,
legacy material/export checks and route smoke checks. The new material test resolved
796,875 combinations and verified independent cue changes. API tests completed 32
formal decisions and 12 ratings across fixed and user-set sessions; both exported
formats passed snapshot/scoring validation. Real Chrome checks exercised keyboard,
mouse and touch sliders, a complete 16-trial flow, resume, save-failure retry,
configuration locking and mobile layouts. Built client chunks contained none of
the 17 private answer explanations.

These checks verify implementation and material structure, not perceived cue
ordering or independent approval of the research materials.
