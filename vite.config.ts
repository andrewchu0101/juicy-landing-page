import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // vitest 預設不處理 CSS（匯入會變成空字串）。tests/trialVisual.test.ts 要讀 trial.css 的文字來守住視覺不變量，只開這一個檔案。
  test: { css: { include: [/trial\.css/] } },
});
