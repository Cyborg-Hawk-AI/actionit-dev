
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Add global unhandled error and promise rejection handlers for debugging
window.addEventListener('error', (event) => {
  console.error('[Global DEBUG] Uncaught error:', event.error);
  console.error('[Global DEBUG] Error message:', event.message);
  console.error('[Global DEBUG] Error at:', event.filename, 'line', event.lineno, 'column', event.colno);
  console.error('[Global DEBUG] Stack trace:', event.error?.stack);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Global DEBUG] Unhandled promise rejection:', event.reason);
  if (event.reason instanceof Error) {
    console.error('[Global DEBUG] Stack trace:', event.reason.stack);
  }
  console.error('[Global DEBUG] Event detail:', event);
});

// Log important browser information
console.log('[App DEBUG] Browser information:', navigator.userAgent);
console.log('[App DEBUG] Current URL:', window.location.href);
console.log('[App DEBUG] Protocol:', window.location.protocol);
console.log('[App DEBUG] Hostname:', window.location.hostname);
console.log('[App DEBUG] Origin:', window.location.origin);

// Catch and log React rendering errors
try {
  console.log('[App DEBUG] Starting React app render');
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error('[App DEBUG] Root element not found!');
    throw new Error('Root element not found');
  }
  console.log('[App DEBUG] Root element found, creating React root');
  createRoot(rootElement).render(<App />);
  console.log('[App DEBUG] React app render initiated successfully');
} catch (error) {
  console.error('[App DEBUG] Failed to render React app:', error);
  console.error('[App DEBUG] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
}
