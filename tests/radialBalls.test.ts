import { describe, expect, it } from 'vitest';
import { demoRadialBalls } from '../src/trial/radialBalls';

// 預期值是 Calendar 固定 commit（102ae19）`services/persistence/repository.ts` 預設六顆球的字面值：
// Coding #E98B87、Study #83B9D0、Exercise #A9C98D、Reading #9C91CE、Rest #E9B96E、Personal #E5A5BD。
// 專案擁有者 2026-11-13：長按圓形選單展示六顆球。
describe('radial menu demo balls', () => {
  it('has six balls in Calendar default order and colors', () => {
    const balls = demoRadialBalls('zh-TW');

    expect(balls).toHaveLength(6);
    expect(balls.map((b) => b.color)).toEqual(['#E98B87', '#83B9D0', '#A9C98D', '#9C91CE', '#E9B96E', '#E5A5BD']);
    expect(balls.map((b) => b.order)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(new Set(balls.map((b) => b.id)).size).toBe(6);
  });

  it('names are bilingual for zh-TW and plain English for en, within 30 characters', () => {
    expect(demoRadialBalls('zh-TW').map((b) => b.name)).toEqual([
      '寫程式 Coding',
      '學習 Study',
      '運動 Exercise',
      '閱讀 Reading',
      '休息 Rest',
      '個人 Personal',
    ]);
    expect(demoRadialBalls('en').map((b) => b.name)).toEqual(['Coding', 'Study', 'Exercise', 'Reading', 'Rest', 'Personal']);
    for (const b of [...demoRadialBalls('zh-TW'), ...demoRadialBalls('en')]) expect([...b.name].length).toBeLessThanOrEqual(30);
  });
});
