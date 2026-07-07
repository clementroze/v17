import { useEffect } from "react";

const SEQUENCE_LENGTH = 3;
const SEQUENCE_KEY = "d";
const MAX_INTERVAL_MS = 600;

export function useAnalyticsDashboard(onTrigger: () => void) {
  useEffect(() => {
    let presses: number[] = [];

    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key !== SEQUENCE_KEY) {
        presses = [];
        return;
      }
      const now = Date.now();
      presses.push(now);
      presses = presses.filter((t) => now - t < MAX_INTERVAL_MS);
      if (presses.length >= SEQUENCE_LENGTH) {
        presses = [];
        onTrigger();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onTrigger]);
}
