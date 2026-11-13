import { describe, expect, it } from 'vitest';
import { buildTrialWorkspace } from '../src/trial/buildTrialWorkspace';

// 預期值為 SDS DATA-02 的字面常數，不呼叫實作去算。
// TC-01a（試用區初始畫面：三天、每天 10:00–15:00）｜FR-01、INV-05、DATA-02
// 契約變更（專案擁有者 2026-11-11）：從單日改為三天（15 小時），不開放到一週。
describe('TC-01a buildTrialWorkspace settings (FR-01, INV-05, DATA-02)', () => {
  it('uses the fixed three-day 10:00–15:00 settings at default zoom with magnet on', () => {
    const workspace = buildTrialWorkspace(new Date(2026, 10, 10, 9, 30));

    expect(workspace.settings).toEqual({
      startHour: 10,
      endHour: 15,
      pixelsPerMinute: 1,
      visibleDays: 3,
      magnetEnabled: true,
      inspectorCollapsed: false,
    });
  });
});

// TC-01a｜FR-01、DATA-01、DATA-03、INV-07（名稱規則部分；templateSchema 待共用模組）
describe('TC-01a buildTrialWorkspace seed (FR-01, DATA-01, DATA-03, INV-07)', () => {
  const now = new Date(2026, 10, 10, 9, 30);

  it('seeds three placeholder balls in order 0,1,2 with valid id, name and color', () => {
    const { templates } = buildTrialWorkspace(now);

    expect(templates.map((t) => t.order)).toEqual([0, 1, 2]);
    expect(templates.map((t) => t.id)).toEqual(['focus', 'rest', 'chore']);
    for (const t of templates) {
      expect(t.id).toMatch(/^[A-Za-z0-9_-]{1,120}$/);
      expect(t.name.trim().length).toBeGreaterThan(0);
      expect([...t.name.trim()].length).toBeLessThanOrEqual(30);
      expect(t.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(t.defaultDuration).toBeGreaterThan(0);
    }
  });

  // 專案擁有者 2026-11-13：試用球改用 Calendar 的柔和色票。預期值是 Calendar 固定 commit 的 DESIGN.md 色票字面值
  // （Sky #83B9D0、Sage #A9C98D、Peach #E9B96E），不是呼叫實作算出來的。
  it('colors the three balls with Calendar palette Sky, Sage and Peach', () => {
    const { templates } = buildTrialWorkspace(now);

    expect(templates.map((t) => t.color)).toEqual(['#83B9D0', '#A9C98D', '#E9B96E']);
  });

  it('starts with no events or issues and stamps meta from the given time', () => {
    const workspace = buildTrialWorkspace(now);

    expect(workspace.events).toEqual({});
    expect(workspace.issues).toEqual([]);
    expect(workspace.meta.name).toBe('trial');
    expect(buildTrialWorkspace(new Date(Date.UTC(2026, 10, 10, 1, 30))).meta.createdAt).toBe('2026-11-10T01:30:00.000Z');
  });
});

// 專案擁有者 2026-11-11：英文版種子球名稱是純英文；中文版維持中英並列。
describe('seed ball names by language', () => {
  const now = new Date(2026, 10, 10, 9, 30);

  it('defaults to the Traditional Chinese bilingual names', () => {
    expect(buildTrialWorkspace(now).templates.map((t) => t.name)).toEqual(['專注 Focus', '休息 Rest', '雜事 Chore']);
  });

  it('uses plain English names for the English site', () => {
    const { templates } = buildTrialWorkspace(now, 'en');
    expect(templates.map((t) => t.name)).toEqual(['Focus', 'Rest', 'Chore']);
    expect(templates.map((t) => t.id)).toEqual(['focus', 'rest', 'chore']);
  });
});
