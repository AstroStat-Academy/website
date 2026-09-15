import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.jsx';
import { aliases, routes } from './routes.js';
import '../styles.css';
import './styles/site.css';

const path = decodeURI(window.location.pathname);
if (aliases[path]) window.history.replaceState(null, '', aliases[path] + window.location.search + window.location.hash);
const route = routes.find(item => item.path === window.location.pathname);
document.title = `AstroStat Academy — ${route?.label || 'Page not found'}`;
document.querySelector('meta[name="description"]').content = route?.description || 'Page not found.';
createRoot(document.getElementById('root')).render(<App />);
