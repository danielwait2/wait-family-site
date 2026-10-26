import { useEffect, useState } from "react";

export const wakeLockSupported = typeof navigator !== "undefined" && "wakeLock" in navigator;

// iOS and Chrome drop the lock whenever the page is hidden, so it is
// re-requested each time the page becomes visible again.
export default function useWakeLock(enabled) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!enabled || !wakeLockSupported) return undefined;
    let sentinel = null;
    let cancelled = false;

    const request = async () => {
      try {
        sentinel = await navigator.wakeLock.request("screen");
        if (cancelled) {
          sentinel.release();
          return;
        }
        setActive(true);
        sentinel.addEventListener("release", () => setActive(false));
      } catch {
        setActive(false);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") request();
    };

    request();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      sentinel?.release().catch(() => {});
      setActive(false);
    };
  }, [enabled]);

  return active;
}
