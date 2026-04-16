import * as React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App'
import MobileChatApp from './pages/MobileChatApp'
import './index.css'

// ── Защита от копирования ──
document.addEventListener('contextmenu', e => e.preventDefault());

document.addEventListener('keydown', e => {
  // F12
  if (e.key === 'F12') { e.preventDefault(); return; }
  // Ctrl+U / Cmd+U — просмотр исходника
  if ((e.ctrlKey || e.metaKey) && e.key === 'u') { e.preventDefault(); return; }
  // Ctrl+S — сохранение страницы
  if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); return; }
  // Ctrl+Shift+I / Cmd+Opt+I — DevTools
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'i' || e.key === 'I')) { e.preventDefault(); return; }
  // Ctrl+Shift+J — консоль
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'j' || e.key === 'J')) { e.preventDefault(); return; }
  // Ctrl+Shift+C — инспектор элементов
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'c' || e.key === 'C')) { e.preventDefault(); return; }
  // Ctrl+A — выделить всё
  if ((e.ctrlKey || e.metaKey) && e.key === 'a') { e.preventDefault(); return; }
  // Ctrl+P — печать
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); return; }
});

// Блокировка drag&drop текста и изображений
document.addEventListener('dragstart', e => e.preventDefault());

// Полная версия на мобильном
if (localStorage.getItem("force_desktop") === "1" || window.location.search.includes("desktop=1")) {
  const meta = document.querySelector('meta[name="viewport"]');
  if (meta) meta.setAttribute("content", "width=1280");
  localStorage.setItem("force_desktop", "1");
}

const isMobile = /mobile|app/i.test(window.location.pathname) || window.location.search.includes("mobile=1");

createRoot(document.getElementById("root")!).render(isMobile ? <MobileChatApp /> : <App />);