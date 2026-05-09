"use client";

import { useState, useEffect } from "react";
import { Timer } from "lucide-react";

interface DrawingTimerProps {
  drawnAt: string | null;
}

export function DrawingTimer({ drawnAt }: DrawingTimerProps) {
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

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex flex-col items-center justify-center space-y-2 mt-4 text-center shadow-sm w-full">
      <Timer className="h-8 w-8 text-purple-600 animate-pulse" />
      {isDrawing ? (
        <div>
          <h3 className="text-lg font-bold text-purple-700">Winner Announcement in Progress!</h3>
          <p className="text-sm text-gray-500">Please wait while we draw the winners.</p>
        </div>
      ) : (
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Winner Announcement In
          </h3>
          <div className="text-3xl font-bold text-purple-600 tabular-nums mt-1">
            {timeLeft}
          </div>
        </div>
      )}
    </div>
  );
}
