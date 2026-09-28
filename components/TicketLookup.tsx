"use client";

import { useState, FormEvent } from "react";
import { Search, Trophy, Loader2, Ticket } from "lucide-react";

interface TicketSeat {
    name: string;
    isWinner: boolean;
    position: number | null;
    prize: string | number | null;
    paid: boolean | null;
}

interface TicketResult {
    ticketId: string;
    status: "PENDING" | "COMPLETED" | "FAILED" | "EXPIRED" | "CANCELLED";
    amount: string | number;
    purchasedAt: string;
    pool: { publicId: string; name: string };
    round: { publicId: string; roundNumber: number; status: string; drawnAt: string | null };
    seats: TicketSeat[];
}

const STATUS_COPY: Record<string, string> = {
    PENDING: "Payment still in progress for this ticket.",
    FAILED: "This ticket's payment didn't go through — it wasn't entered into the draw.",
    EXPIRED: "This ticket expired before payment completed.",
    CANCELLED: "This ticket was cancelled.",
};

export default function TicketLookup() {
    const [ticketId, setTicketId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<TicketResult | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const trimmed = ticketId.trim();
        if (!trimmed) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch(`/api/tickets/${encodeURIComponent(trimmed)}`);
            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.message || "Couldn't find a ticket with that ID.");
                return;
            }

            setResult(data.data);
        } catch {
            setError("Something went wrong looking that up. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const hasWinner = result?.seats.some(s => s.isWinner);
    const roundDecided = result?.round.status === "CLOSED";

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
                <Ticket className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Check your ticket</h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                Enter the ticket ID from your booking confirmation — no login needed.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    value={ticketId}
                    onChange={(e) => setTicketId(e.target.value)}
                    placeholder="e.g. cmg2x9f0a0001..."
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                    type="submit"
                    disabled={loading || !ticketId.trim()}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Check
                </button>
            </form>

            {error && (
                <div className="mt-5 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300 text-center">
                    {error}
                </div>
            )}

            {result && (
                <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {result.pool.name} · Round {result.round.roundNumber}
                            </p>
                            <p className="text-xs text-gray-400">
                                Ticket {result.ticketId.slice(0, 10)}… · {new Date(result.purchasedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                        </div>
                        {roundDecided && hasWinner && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold">
                                <Trophy className="w-3.5 h-3.5" /> You won!
                            </span>
                        )}
                    </div>

                    {result.status !== "COMPLETED" ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {STATUS_COPY[result.status] ?? "This ticket isn't active."}
                        </p>
                    ) : !roundDecided ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            This round hasn't been drawn yet — check back after the draw.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {result.seats.map((seat) => (
                                <div
                                    key={seat.name}
                                    className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm ${
                                        seat.isWinner
                                            ? "bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300"
                                            : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                                    }`}
                                >
                                    <span className="font-medium">Seat {seat.name}</span>
                                    {seat.isWinner ? (
                                        <span className="font-semibold">
                                            #{seat.position} · ₹{Number(seat.prize).toLocaleString("en-IN")}
                                            {seat.paid ? " · Paid" : " · Payout pending"}
                                        </span>
                                    ) : (
                                        <span>Not a winning seat</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
