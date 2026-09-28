"use client";

import { useState, useEffect } from "react";
import { Timer, AlertTriangle } from "lucide-react";

// Seats are only held for the player while `tokenExpiresAt` is in the
// future. This makes that deadline visible instead of silent, and tells the
// caller when it's passed so the booking button can be disabled.
export function ReservationCountdown({
  expiresAt,
  onExpire,
}: {
  expiresAt: string;
  onExpire?: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    const target = new Date(expiresAt).getTime();
    if (isNaN(target)) return;

    let firedExpire = false;

    const tick = () => {
      const diff = Math.round((target - Date.now()) / 1000);
      setSecondsLeft(Math.max(diff, 0));
      if (diff <= 0 && !firedExpire) {
        firedExpire = true;
        onExpire?.();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  if (secondsLeft === null) return null;

  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;
  const label = `${mm}:${ss.toString().padStart(2, "0")}`;
  const isUrgent = secondsLeft <= 60;
  const isExpired = secondsLeft <= 0;

  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
        isExpired
          ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          : isUrgent
          ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
      }`}
    >
      {isExpired ? <AlertTriangle className="w-3.5 h-3.5" /> : <Timer className="w-3.5 h-3.5" />}
      {isExpired ? "Reservation ended" : `Complete payment in ${label}`}
    </div>
  );
}
