// 骨架入口：只證明頁面可啟動。頁面結構見 issues/002，業務邏輯見後續票。
export const SKELETON_MARKER = 'juicy-landing-page skeleton';

const root = document.getElementById('root');
if (root) root.textContent = SKELETON_MARKER;
