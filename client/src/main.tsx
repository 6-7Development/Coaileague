import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Suppress Vite HMR WebSocket errors in development (harmless dev-only warnings)
if (import.meta.env.DEV) {
  // Handle unhandled promise rejections (WebSocket errors from Vite)
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    if (event.reason?.message?.includes("Failed to construct 'WebSocket'") || 
        event.reason?.message?.includes("localhost:undefined")) {
      event.preventDefault(); // Suppress the error
    }
  });
  
  // Also suppress console.error for these
  const origError = console.error;
  console.error = (...args: any[]) => {
    if (args[0]?.message?.includes("Failed to construct 'WebSocket'")) {
      return;
    }
    origError(...args);
  };
}

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for PWA support (offline, caching, installability)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('AutoForce™ PWA: Service Worker registered', registration.scope);
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
      })
      .catch((error) => {
        console.error('AutoForce™ PWA: Service Worker registration failed', error);
      });
  });
}
