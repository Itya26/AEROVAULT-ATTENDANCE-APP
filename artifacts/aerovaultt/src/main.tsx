import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

registerSW({
  onNeedRefresh() {
    if (confirm("A new version is available. Reload to update?")) {
      location.reload();
    }
  },
  onOfflineReady() {
    console.log("AEROVAULT is ready to work offline.");
  },
});

createRoot(document.getElementById("root")!).render(<App />);
