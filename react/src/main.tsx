import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom"; // Import HashRouter
import "./index.css";
import './i18n/config'; // STAGE 29: Initialize i18n
import App from "./App";
import { useUserStore } from "./store/useUserStore";

// Initialize store wrapper
function AppWrapper() {
  useEffect(() => {
    useUserStore.getState().initialize();
  }, []);

  return <App />;
}

import { ErrorBoundary } from "./components/common/ErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary
    componentName="App Root"
    onError={(error, errorInfo) => {
      // Send to analytics/monitoring
      console.error('Global error:', error, errorInfo);
    }}
  >
    <HashRouter>
      <AppWrapper />
    </HashRouter>
  </ErrorBoundary>
);
