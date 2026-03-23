import * as React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App'
import MobileChatApp from './pages/MobileChatApp'
import './index.css'

const isMobile = /mobile|app/i.test(window.location.pathname) || window.location.search.includes("mobile=1");

createRoot(document.getElementById("root")!).render(isMobile ? <MobileChatApp /> : <App />);