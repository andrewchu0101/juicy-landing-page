// 磁吸換算表逐列的字面常數（TC-02、REUSE-01、AC-01.1）。每分鐘 1 像素，可見範圍起點 10:00。
// 來源是人工依規則算出，不是執行 Calendar：SDS 的 11 列，加上 docs/06-test-plan.md TC-02 多列的 raw 23（離 30 為 7 ≤ 8，吸附到 10:30）。
// 由 tests/trialEngine.test.ts 的 TC-02 對網站自己的 pointerToTime 逐列比對。
export const MAGNET_ROWS: ReadonlyArray<{ raw: number; start: string }> = [
  { raw: 0, start: '10:00' },
  { raw: 8, start: '10:00' },
  { raw: 8.4, start: '10:08' },
  { raw: 15, start: '10:15' },
  { raw: 21, start: '10:21' },
  { raw: 21.5, start: '10:22' },
  { raw: 22, start: '10:30' },
  { raw: 23, start: '10:30' },
  { raw: 30, start: '10:30' },
  { raw: 38, start: '10:30' },
  { raw: 38.5, start: '10:39' },
  { raw: 39, start: '10:39' },
];
