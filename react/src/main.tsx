import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom"; // Import HashRouter
import "./index.css";
import App from "./App";
import { useUserStore } from "./store/useUserStore";

// Initialize store wrapper
function AppWrapper() {
  useEffect(() => {
    useUserStore.getState().initialize();
  }, []);

  return <App />;
}

import ErrorBoundary from "./components/ErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <AppWrapper />
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>
);
