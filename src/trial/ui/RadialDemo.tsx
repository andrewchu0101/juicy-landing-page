// 步驟 1（專案擁有者 2026-11-14）：試著長按。一塊空白的區域，長按它會跑出六顆球，hover 時果凍晃動；只展示，不建立任何東西。
// 手勢是同一套 createRadial（沒有 drag）：離開球只是停止晃動，放開或 Escape 關閉。六顆球是 Calendar 預設的六顆。
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSiteLanguage } from '../../site/LanguageContext';
import type { Point } from '../engine/pointer';
import { createRadial, type RadialMenu } from '../gestures/radial';
import { demoRadialBalls } from '../radialBalls';
import '../trial.css';
import { RadialPalette } from './Overlays';

export function RadialDemo() {
  const { language, copy } = useSiteLanguage();
  const padRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<RadialMenu | null>(null);

  // 六顆展示球依目前網站語言命名（選單是暫時的，不像種子球名稱要固定）。
  const balls = useMemo(() => demoRadialBalls(language), [language]);
  const ballsRef = useRef(balls);
  useEffect(() => {
    ballsRef.current = balls;
  });

  const radial = useMemo(
    () =>
      createRadial({
        templates: () => ballsRef.current,
        viewport: () => ({ width: window.innerWidth, height: window.innerHeight }),
        onMenu: setMenu,
      }),
    [],
  );

  useEffect(() => {
    const at = (event: PointerEvent): Point => ({ x: event.clientX, y: event.clientY });
    const down = (event: PointerEvent) => {
      if (event.button !== 0 || !(event.target instanceof Node) || !padRef.current?.contains(event.target)) return;
      radial.down(event.pointerId, at(event));
    };
    const move = (event: PointerEvent) => radial.move(event.pointerId, at(event));
    const up = (event: PointerEvent) => radial.up(event.pointerId);
    const cancel = () => radial.cancel();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') radial.escape();
    };
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('blur', cancel);
    window.addEventListener('keydown', key, true);
    return () => {
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('blur', cancel);
      window.removeEventListener('keydown', key, true);
      radial.destroy(); // 卸載時清掉進行中的長按計時器（REUSE-05）
    };
  }, [radial]);

  return (
    <div className="trial-root radial-demo" data-testid="radial-demo">
      <div ref={padRef} className="radial-demo-pad" data-testid="radial-demo-pad">
        {/* 選單展開時提示就沒用了，而且會被圓形選單蓋住：隱藏（保留版面，不跳動）。 */}
        <span style={{ visibility: menu ? 'hidden' : 'visible' }}>{copy.trial.steps.one.hint}</span>
      </div>
      <RadialPalette menu={menu} templates={balls} label={copy.trial.steps.one.menuAria} />
    </div>
  );
}
