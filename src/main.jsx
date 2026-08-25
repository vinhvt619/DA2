import React from "react";
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import App from "./Pages/App.jsx";
import AppErrorFallback from "./Components/AppErrorFallback.jsx";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ErrorBoundary
      FallbackComponent={AppErrorFallback}
      onReset={() => window.location.reload()}
    >
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
