"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * The fifth data state (responsive-mobile-first skill): when the network drops
 * the user is told immediately instead of meeting a failed fetch later.
 */
export function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-warning/15 px-4 py-2 text-sm text-warning"
    >
      <WifiOff size={15} aria-hidden />
      You are offline. Reconnect to continue generating and submitting quizzes.
    </div>
  );
}
