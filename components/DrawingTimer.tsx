"use client";

import { useState, useEffect } from "react";
import { Timer } from "lucide-react";

interface DrawingTimerProps {
  drawnAt: string | null;
  /** Small inline pill for use inside cards */
  compact?: boolean;
}

export function DrawingTimer({ drawnAt, compact = false }: DrawingTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!drawnAt) return;

    const parsedDate = new Date(drawnAt);
    const targetTime = parsedDate.getTime();

    if (isNaN(targetTime)) {
      console.error("Invalid drawnAt date:", drawnAt);
      return;
    }

    let interval: NodeJS.Timeout;

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setIsDrawing(true);
        setTimeLeft("00:00:00");
        if (interval) clearInterval(interval);
      } else {
        setIsDrawing(false);
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        const timeStr = `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
          
        setTimeLeft(days > 0 ? `${days}d ${timeStr}` : timeStr);
      }
    };

    updateTimer();
    interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [drawnAt]);

  if (!drawnAt || !mounted) return null;

  if (compact) {
    return (
      <div className="flex items-center justify-center gap-1.5 w-full h-10 rounded-xl bg-brand-50 border border-brand-200 text-brand-800 text-xs sm:text-sm font-bold">
        <Timer className="h-4 w-4 shrink-0 animate-pulse" />
        {isDrawing ? (
          <span>Drawing now…</span>
        ) : (
          <span className="tabular-nums">Result in {timeLeft}</span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 flex flex-col items-center justify-center space-y-2 mt-4 text-center shadow-sm w-full">
      <Timer className="h-8 w-8 text-brand-600 animate-pulse" />
      {isDrawing ? (
        <div>
          <h3 className="text-lg font-bold text-brand-700">Winner Announcement in Progress!</h3>
          <p className="text-sm text-gray-500">Please wait while we draw the winners.</p>
        </div>
      ) : (
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Winner Announcement In
          </h3>
          <div className="text-3xl font-bold text-brand-600 tabular-nums mt-1">
            {timeLeft}
          </div>
        </div>
      )}
    </div>
  );
}
