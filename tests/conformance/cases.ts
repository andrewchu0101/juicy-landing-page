// TC-11 一致性案例的「人工算例預期值」（SDS「沿用行為的一致性案例」、AC-01.16）。
// 預期值全部來自 SRS 沿用登記表（REUSE-nn）、PRD 與 docs/06-test-plan.md 的人工算例，
// 不呼叫任何實作，也不是執行 Calendar 的結果。尚無執行器：共用模組取得方式未核准（D-11），
// 所以這裡只有資料，沒有任何一個案例被實際執行過（狀態一律「未執行」）。
// 執行器接入後若與這些值不一致：記錄「案例 ID、人工值、基準值、規格出處」，先查原因，不改這裡的值。

/** 示範日（anchor）本地 00:00 起算：day 0 是示範日當天，time 為 24 小時制 HH:mm。 */
export type At = { day: number; time: string };
export type Title = string | { fromTemplate: string };
type Ref = `$${number}`;

export type Step =
  | { op: 'create'; templateId: string; start: At }
  | { op: 'update'; ref: Ref; patch: { title?: string; startAt?: At; endAt?: At } }
  | { op: 'select'; refs: Ref[] }
  | { op: 'deleteSelected' }
  | { op: 'undo' }
  | { op: 'redo' }
  | { op: 'copy' }
  /** at：貼上時的目標時間（Calendar：游標位置或右鍵選單位置）；最早的來源區塊起點移到這裡。 */
  | { op: 'paste'; at: At };

export type ExpectedEvent = {
  ref: Ref;
  title: Title;
  /** 省略表示規格沒有給出可由人工算出的值（見 openQuestion）。 */
  start?: At;
  end?: At;
  /** 'template' 表示等於建立時所選球的顏色，不寫死色碼（種子色碼待 OR-12）。 */
  color: 'template' | 'unchanged';
};

export type ExpectedState = {
  events: ExpectedEvent[];
  pastLength: number;
  futureLength: number;
};

export type ConformanceCase = {
  id: string;
  /** 規格出處（REUSE / AC / INV / OR）。 */
  source: string[];
  /** 起始設定：三天（每天可見 10:00–15:00）、三顆種子球；preset 為起始就存在、不佔歷史的區塊。 */
  preset: { ref: Ref; title: string; start: At; end: At }[];
  steps: Step[];
  /** 全部步驟之後的最終狀態。 */
  expect: ExpectedState;
  /** 中途檢查點：afterStep 是 steps 的 0 起算索引。 */
  checkpoints?: { afterStep: number; expect: ExpectedState }[];
  /** 不得丟出例外（INV-12）。 */
  noThrow?: true;
  /** 受阻原因；有值就不得寫成已驗證。 */
  blocked?: string;
  /** 規格沒寫死、人工無法算出的部分；列出來問專案擁有者，不自己決定。 */
  openQuestion?: string;
  derivation: string;
};

const t = (time: string, day = 0): At => ({ day, time });
const T1 = 'seed-1';

const AB: ConformanceCase['preset'] = [
  { ref: '$1', title: 'A', start: t('10:00'), end: t('12:00') },
  { ref: '$2', title: 'B', start: t('12:00'), end: t('14:00') },
];

export const CONFORMANCE_CASES: ConformanceCase[] = [
  {
    id: 'CONF-01',
    source: ['AC-01.1', 'REUSE-02', 'REUSE-03', 'REUSE-04', 'REUSE-09'],
    preset: [],
    steps: [
      { op: 'create', templateId: T1, start: t('10:30') },
      { op: 'update', ref: '$1', patch: { endAt: t('13:00') } },
      { op: 'update', ref: '$1', patch: { title: '寫 PRD' } },
    ],
    expect: {
      events: [{ ref: '$1', title: '寫 PRD', start: t('10:30'), end: t('13:00'), color: 'template' }],
      pastLength: 3,
      futureLength: 0,
    },
    derivation:
      '10:30 起建立（距半點 0，磁吸不影響）；終點 13:00 = 10:30 + 150 分鐘；建立、調整長度、命名各一步 = 3（與 TC-03 3g 的 pastLength 一致）。',
  },
  {
    id: 'CONF-02',
    source: ['AC-01.10', 'REUSE-08'],
    preset: [],
    steps: [
      { op: 'create', templateId: T1, start: t('10:00') }, // 0
      { op: 'update', ref: '$1', patch: { startAt: t('12:30'), endAt: t('14:30') } }, // 1 移動，長度不變
      { op: 'update', ref: '$1', patch: { title: '寫 PRD' } }, // 2
      { op: 'select', refs: ['$1'] }, // 3 選取不佔步
      { op: 'deleteSelected' }, // 4
      { op: 'undo' }, // 5 A 回來（移動後時間、名稱「寫 PRD」）
      { op: 'undo' }, // 6 標題回到命名前
      { op: 'undo' }, // 7 回到建立時的時間
      { op: 'undo' }, // 8 日曆為空
      { op: 'redo' }, // 9 A 重新出現在建立時的時間
      { op: 'create', templateId: T1, start: t('13:00') }, // 10 新操作清除重做
    ],
    checkpoints: [
      { afterStep: 5, expect: { events: [{ ref: '$1', title: '寫 PRD', start: t('12:30'), end: t('14:30'), color: 'template' }], pastLength: 3, futureLength: 1 } },
      { afterStep: 6, expect: { events: [{ ref: '$1', title: { fromTemplate: T1 }, start: t('12:30'), end: t('14:30'), color: 'template' }], pastLength: 2, futureLength: 2 } },
      { afterStep: 7, expect: { events: [{ ref: '$1', title: { fromTemplate: T1 }, start: t('10:00'), end: t('12:00'), color: 'template' }], pastLength: 1, futureLength: 3 } },
      { afterStep: 8, expect: { events: [], pastLength: 0, futureLength: 4 } },
      { afterStep: 9, expect: { events: [{ ref: '$1', title: { fromTemplate: T1 }, start: t('10:00'), end: t('12:00'), color: 'template' }], pastLength: 1, futureLength: 3 } },
    ],
    expect: {
      events: [
        { ref: '$1', title: { fromTemplate: T1 }, start: t('10:00'), end: t('12:00'), color: 'template' },
        { ref: '$2', title: { fromTemplate: T1 }, start: t('13:00'), end: t('15:00'), color: 'template' },
      ],
      pastLength: 2,
      futureLength: 0,
    },
    derivation:
      '建立 120 分鐘（REUSE-02）；移動長度不變：12:30 + 120 = 14:30（REUSE-03）；四個變更步驟（建立、移動、命名、刪除）→ 復原 ×4 後 pastLength 0、futureLength 4；重做 1 次 → 1/3；新操作 → pastLength 2、futureLength 0（AC-01.10）。選取不進歷史（REUSE-06）。',
  },
  {
    id: 'CONF-03',
    source: ['AC-01.9', 'REUSE-07'],
    preset: AB,
    steps: [{ op: 'deleteSelected' }],
    expect: {
      events: [
        { ref: '$1', title: 'A', start: t('10:00'), end: t('12:00'), color: 'unchanged' },
        { ref: '$2', title: 'B', start: t('12:00'), end: t('14:00'), color: 'unchanged' },
      ],
      pastLength: 0,
      futureLength: 0,
    },
    derivation: '沒有選取時不動作（REUSE-07）：事件與歷史長度不變。',
  },
  {
    id: 'CONF-04',
    source: ['INV-12', 'REUSE-09'],
    preset: [{ ref: '$1', title: 'A', start: t('10:00'), end: t('12:00') }],
    steps: [
      { op: 'update', ref: '$1', patch: { title: '' } },
      { op: 'update', ref: '$1', patch: { title: '   ' } },
      { op: 'update', ref: '$1', patch: { title: 'A'.repeat(31) } },
    ],
    expect: {
      events: [{ ref: '$1', title: 'A', start: t('10:00'), end: t('12:00'), color: 'unchanged' }],
      pastLength: 0,
      futureLength: 0,
    },
    noThrow: true,
    derivation:
      '去前後空白後不可為空；上限 30 個使用者看到的字元（NAME_MAX_CHARS）。空字串、純空白、31 字都被拒絕：標題不變、不佔步、不丟例外（INV-12）。',
  },
  {
    id: 'CONF-05',
    source: ['REUSE-09'],
    preset: [{ ref: '$1', title: 'A', start: t('10:00'), end: t('12:00') }],
    steps: [{ op: 'update', ref: '$1', patch: { title: 'A' } }],
    expect: {
      events: [{ ref: '$1', title: 'A', start: t('10:00'), end: t('12:00'), color: 'unchanged' }],
      pastLength: 0,
      futureLength: 0,
    },
    derivation: '內容未變不佔步（REUSE-09）。',
  },
  {
    id: 'CONF-06',
    source: ['REUSE-08', 'OR-25'],
    preset: [{ ref: '$1', title: 'T0', start: t('10:00'), end: t('12:00') }],
    // 101 個各不相同的有效改名（T1…T101），每一個都是有效變更。
    steps: Array.from({ length: 101 }, (_, i): Step => ({ op: 'update', ref: '$1', patch: { title: `T${i + 1}` } })),
    expect: {
      events: [{ ref: '$1', title: 'T101', start: t('10:00'), end: t('12:00'), color: 'unchanged' }],
      pastLength: 100,
      futureLength: 0,
    },
    blocked:
      '受阻於 015（OR-25）：Calendar 找不到 100 步上限的測試，須先在共用層補測；補測前此案例標「受阻」，不省略。',
    derivation: '101 個有效變更，歷史上限 100 步（REUSE-08）→ pastLength = 100。',
  },
  {
    id: 'CONF-07',
    source: ['REUSE-04'],
    preset: [{ ref: '$1', title: 'A', start: t('10:00'), end: t('12:00') }],
    steps: [{ op: 'update', ref: '$1', patch: { endAt: t('10:01') } }],
    expect: {
      events: [{ ref: '$1', title: 'A', start: t('10:00'), end: t('10:01'), color: 'unchanged' }],
      pastLength: 1,
      futureLength: 0,
    },
    derivation:
      '最小 1 分鐘允許：10:00 起、終點 10:01 = 長度 1 分鐘（REUSE-04）；一個變更 = 1 步。「超過 10080 分鐘夾住」的子案例：專案擁有者 2026-11-11 決定網站不開放到一週，只開放三天的範圍，且調整長度本來就暫不開放，所以此子案例不在網站驗收內（暫不開放，不是已通過）。',
  },
  {
    id: 'CONF-08',
    source: ['REUSE-02', 'REUSE-11'],
    preset: [],
    steps: [{ op: 'create', templateId: T1, start: t('14:30') }],
    expect: {
      events: [{ ref: '$1', title: { fromTemplate: T1 }, start: t('14:30'), end: t('16:30'), color: 'template' }],
      pastLength: 1,
      futureLength: 0,
    },
    derivation: '14:30 + 120 分鐘 = 16:30；可見範圍到 15:00，區塊可延伸到範圍外並被保存（REUSE-11）。',
  },
  {
    id: 'CONF-09',
    source: ['REUSE-07', 'REUSE-10'],
    preset: [...AB, { ref: '$3', title: 'C', start: t('14:00'), end: t('15:00') }],
    steps: [{ op: 'select', refs: ['$1', '$2'] }, { op: 'deleteSelected' }, { op: 'undo' }],
    checkpoints: [
      { afterStep: 1, expect: { events: [{ ref: '$3', title: 'C', start: t('14:00'), end: t('15:00'), color: 'unchanged' }], pastLength: 1, futureLength: 0 } },
    ],
    expect: {
      events: [
        { ref: '$1', title: 'A', start: t('10:00'), end: t('12:00'), color: 'unchanged' },
        { ref: '$2', title: 'B', start: t('12:00'), end: t('14:00'), color: 'unchanged' },
        { ref: '$3', title: 'C', start: t('14:00'), end: t('15:00'), color: 'unchanged' },
      ],
      pastLength: 0,
      futureLength: 1,
    },
    derivation: '多選刪除算 1 步（REUSE-07）；復原後全部回來，pastLength 回到 0、futureLength 1。',
  },
  {
    id: 'CONF-10',
    source: ['REUSE-10'],
    preset: [{ ref: '$1', title: 'A', start: t('10:00'), end: t('12:00') }],
    steps: [{ op: 'select', refs: ['$1'] }, { op: 'copy' }, { op: 'paste', at: t('14:00') }],
    expect: {
      events: [
        { ref: '$1', title: 'A', start: t('10:00'), end: t('12:00'), color: 'unchanged' },
        { ref: '$2', title: 'A', start: t('14:00'), end: t('16:00'), color: 'unchanged' },
      ],
      pastLength: 1,
      futureLength: 0,
    },
    derivation:
      '專案擁有者 2026-11-11 決定貼上位置「跟原本 Calendar 一樣」。固定基準 `engine/mutations.ts#copiedEventTimes` 的規則：位移量 = 目標時間 − 被複製區塊中最早的起點，每個區塊的起迄都加上同一個位移量。這裡 10:00 → 14:00 = +4 小時，副本為 14:00–16:00，長度不變；貼上算 1 步（SDS CONF-10）。網站暫不開放剪貼簿，所以此案例網站端不執行。',
  },
];
