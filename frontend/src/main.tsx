import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize theme before app renders to prevent flash
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.classList.add(savedTheme);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
  }
};

initializeTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
