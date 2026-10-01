"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Radio, Timer } from "lucide-react";

interface ActiveRound {
    roundNumber: number;
    publicId: string;
    status: "ACTIVE" | "UPCOMING" | "DRAWING" | "CLOSED";
    startsAt: string;
    endsAt: string;
    drawnAt: string | null;
    availableSeats: number;
}

interface PoolSummary {
    publicId: string;
    name: string;
    perSeatPrice: string | number;
    activeRound: ActiveRound | null;
}

interface NextDraw {
    poolPublicId: string;
    roundPublicId: string;
    poolName: string;
    roundNumber: number;
    targetTime: number;
    isDrawing: boolean;
}

function formatCountdown(ms: number): string {
    if (ms <= 0) return "00:00:00";
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    const timeStr = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    return days > 0 ? `${days}d ${timeStr}` : timeStr;
}

export default function NextDrawBar() {
    const [nextDraw, setNextDraw] = useState<NextDraw | null | undefined>(undefined);
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadPools() {
            try {
                const res = await fetch("/api/pools", { cache: "no-store" });
                if (!res.ok) throw new Error("Failed to load pools");
                const data = await res.json();
                const pools: PoolSummary[] = data?.success && Array.isArray(data.data) ? data.data : [];

                const candidates = pools
                    .filter((p) => p.activeRound && p.activeRound.status !== "CLOSED")
                    .map((p) => {
                        const round = p.activeRound as ActiveRound;
                        const isDrawing = round.status === "DRAWING";
                        const target = isDrawing && round.drawnAt ? round.drawnAt : round.endsAt;
                        return {
                            poolPublicId: p.publicId,
                            roundPublicId: round.publicId,
                            poolName: p.name,
                            roundNumber: round.roundNumber,
                            targetTime: new Date(target).getTime(),
                            isDrawing,
                        };
                    })
                    .filter((c) => !Number.isNaN(c.targetTime))
                    .sort((a, b) => a.targetTime - b.targetTime);

                if (!cancelled) setNextDraw(candidates[0] ?? null);
            } catch {
                if (!cancelled) setNextDraw(null);
            }
        }

        loadPools();
        // Refresh the underlying data periodically in case rounds change status
        const refresh = setInterval(loadPools, 60_000);
        return () => {
            cancelled = true;
            clearInterval(refresh);
        };
    }, []);

    useEffect(() => {
        if (!nextDraw) return;
        const tick = () => setTimeLeft(formatCountdown(nextDraw.targetTime - Date.now()));
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [nextDraw]);

    // Still loading, or nothing to show — render nothing rather than an empty bar
    if (!nextDraw) return null;

    const isImminent = nextDraw.targetTime - Date.now() <= 0;

    return (
        <Link
            href={`/pools/${nextDraw.poolPublicId}?roundId=${nextDraw.roundPublicId}`}
            className="block w-full bg-purple-600 hover:bg-purple-700 transition-colors text-white text-xs sm:text-sm"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-center gap-2 text-center">
                {nextDraw.isDrawing || isImminent ? (
                    <>
                        <Radio className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                        <span className="font-semibold">Live now — {nextDraw.poolName}, Round {nextDraw.roundNumber} is drawing</span>
                    </>
                ) : (
                    <>
                        <Timer className="w-3.5 h-3.5 shrink-0" />
                        <span>
                            Next draw: <span className="font-semibold">{nextDraw.poolName}, Round {nextDraw.roundNumber}</span>
                            {" "}in <span className="font-mono font-semibold tabular-nums">{timeLeft}</span>
                        </span>
                    </>
                )}
            </div>
        </Link>
    );
}
