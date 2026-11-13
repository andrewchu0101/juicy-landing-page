// 長按空白處叫出的圓形選單：六顆展示球（專案擁有者 2026-11-13）。
// 色碼與順序是 Calendar 固定 commit（102ae19）`services/persistence/repository.ts` 預設六顆球；
// 這些球只用來展示 hover 的果凍晃動，不能建立區塊（建立區塊只在側邊三顆種子球）。
import type { SiteLanguage } from '../site/webLanguageBackend';

export type RadialBall = { id: string; name: string; color: string; order: number };

const BALLS: ReadonlyArray<{ id: string; color: string; names: Record<SiteLanguage, string> }> = [
  { id: 'coding', color: '#E98B87', names: { 'zh-TW': '寫程式 Coding', en: 'Coding' } },
  { id: 'study', color: '#83B9D0', names: { 'zh-TW': '學習 Study', en: 'Study' } },
  { id: 'exercise', color: '#A9C98D', names: { 'zh-TW': '運動 Exercise', en: 'Exercise' } },
  { id: 'reading', color: '#9C91CE', names: { 'zh-TW': '閱讀 Reading', en: 'Reading' } },
  { id: 'rest', color: '#E9B96E', names: { 'zh-TW': '休息 Rest', en: 'Rest' } },
  { id: 'personal', color: '#E5A5BD', names: { 'zh-TW': '個人 Personal', en: 'Personal' } },
];

export function demoRadialBalls(language: SiteLanguage): RadialBall[] {
  return BALLS.map((ball, order) => ({ id: ball.id, name: ball.names[language], color: ball.color, order }));
}
