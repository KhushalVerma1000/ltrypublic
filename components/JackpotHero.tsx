"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

interface FeaturedRound {
    poolName: string;
    roundNumber: number;
    availableSeats: number;
    totalSeats: number;
    endsAt: string;
    drawnAt: string | null;
    isDrawing: boolean;
}

interface JackpotHeroProps {
    totalPrizePool: number;
    featured: FeaturedRound | null;
}

function formatCountdown(ms: number): string {
    if (ms <= 0) return "00:00:00";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function formatINR(n: number): string {
    return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export default function JackpotHero({ totalPrizePool, featured }: JackpotHeroProps) {
    const target = featured
        ? new Date(featured.isDrawing && featured.drawnAt ? featured.drawnAt : featured.endsAt).getTime()
        : null;
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        if (!target) return;
        const tick = () => setTimeLeft(formatCountdown(target - Date.now()));
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [target]);

    const soldPct = featured
        ? Math.min(100, Math.round(((featured.totalSeats - featured.availableSeats) / featured.totalSeats) * 100))
        : 0;

    return (
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-2xl p-8 shadow-xl shadow-purple-600/20">
            <div className="flex items-center gap-2 text-purple-200 text-xs font-semibold uppercase tracking-widest mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                {featured ? "Prize pool right now" : "No live rounds right now"}
            </div>

            <p className="text-4xl sm:text-5xl font-bold tabular-nums mb-1">
                {formatINR(totalPrizePool)}
            </p>
            <p className="text-purple-200 text-sm mb-6">
                {featured ? "across all rounds open for booking" : "check back soon for the next round"}
            </p>

            {featured && (
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between text-xs text-purple-200 mb-1.5">
                            <span className="font-medium text-white">{featured.poolName}, Round {featured.roundNumber}</span>
                            <span>{soldPct}% booked</span>
                        </div>
                        <div className="h-2 w-full bg-purple-900/40 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white rounded-full transition-all"
                                style={{ width: `${soldPct}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm border-t border-purple-400/30 pt-4">
                        <span className="text-purple-200">
                            {featured.isDrawing ? "Drawing live now" : "Seats close in"}
                        </span>
                        <span className="font-mono font-semibold tabular-nums text-base">
                            {featured.isDrawing ? "Now" : timeLeft || "—"}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
