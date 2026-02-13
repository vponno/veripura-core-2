import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Secret Developer Signature 🔐
console.log(
  '%c🔐 Secure Code & Architecture by \n%chttps://x.com/onoff_',
  'color: #0ea5e9; font-weight: bold; font-size: 14px; margin-top: 10px; padding: 5px;',
  'color: #6366f1; font-weight: bold; font-size: 12px; text-decoration: underline; padding-left: 5px;'
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);