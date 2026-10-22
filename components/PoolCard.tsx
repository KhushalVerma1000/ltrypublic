import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarClock, Sparkles } from "lucide-react";
import { DrawingTimer } from "@/components/DrawingTimer";

export interface PoolCardData {
    publicId: string;
    name: string;
    perSeatPrice: string | number;
    notes: string | null;
    totalSeats?: number;
    activeRound: {
        roundNumber: number;
        publicId: string;
        status: string;
        startsAt: string;
        endsAt: string;
        drawnAt: string | null;
        availableSeats: number;
        soldSeats?: number | null;
    } | null;
}

/**
 * Per-card tints for the illustration panel. Only the panel is tinted —
 * the body stays white so every card reads the same regardless of tint.
 */
export const CARD_TINTS = [
    "from-brand-100 to-brand-200",
    "from-gold-100 to-gold-200",
    "from-teal-100 to-teal-200",
    "from-rose-100 to-rose-200",
];

const STATUS: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: "Open", className: "bg-brand-700 text-white" },
    UPCOMING: { label: "Upcoming", className: "bg-gold-400 text-ink" },
    DRAWING: { label: "Drawing", className: "bg-rose-600 text-white animate-pulse" },
};

const formatINR = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—";

export default function PoolCard({
    pool,
    image,
    tint,
    priority = false,
}: {
    pool: PoolCardData;
    image: string;
    tint: string;
    priority?: boolean;
}) {
    const round = pool.activeRound;
    const available = round?.availableSeats ?? 0;
    const total = pool.totalSeats ?? available + (round?.soldSeats ?? 0);
    const sold = Math.max(total - available, 0);
    const fillPct = total > 0 ? Math.min(100, Math.round((sold / total) * 100)) : 0;
    const isSoldOut = available <= 0;
    const isLow = !isSoldOut && total > 0 && available / total <= 0.2;
    const status = STATUS[round?.status ?? "UPCOMING"] ?? STATUS.ACTIVE;
    const isDrawing = round?.status === "DRAWING";
    // Prize pool is fixed: seat price × total seats. It does not grow as seats fill.
    const prizePool = Number(pool.perSeatPrice) * total;

    // Guests can browse the seat map; login is only asked for when they book.
    const href = round ? `/pools/${pool.publicId}?roundId=${round.publicId}` : `/pools/${pool.publicId}`;

    return (
        <Link
            href={href}
            aria-label={`${pool.name}, ${formatINR(Number(pool.perSeatPrice))} per seat, ${
                isSoldOut ? "sold out" : `${available} seats left`
            }`}
            className="group relative flex flex-col h-full bg-white rounded-[var(--radius-card)] border border-brand-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
            {/* Illustration panel */}
            <div className={`relative aspect-[5/4] sm:aspect-[16/10] bg-gradient-to-br ${tint} overflow-hidden`}>
                <div className="absolute inset-x-0 top-0 flex items-start justify-between p-1.5 sm:p-3 z-10">
                    <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide shadow-sm whitespace-nowrap ${status.className}`}>
                        {status.label}
                    </span>
                    <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-white/90 text-ink text-[10px] sm:text-xs font-bold shadow-sm whitespace-nowrap">
                        <span className="sm:hidden">R{round?.roundNumber}</span>
                        <span className="hidden sm:inline">Round {round?.roundNumber}</span>
                    </span>
                </div>

                <Image
                    src={image}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    unoptimized
                    priority={priority}
                    className={`object-contain object-bottom px-3 pt-7 sm:pt-10 transition-transform duration-500 group-hover:scale-105 ${isSoldOut ? "grayscale opacity-70" : ""}`}
                />

                {prizePool > 0 && (
                    <span
                        title="Total prize pool"
                        className="absolute left-1.5 bottom-1.5 sm:left-3 sm:bottom-3 z-10 inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-ink/85 text-gold-300 text-[11px] sm:text-meta font-bold whitespace-nowrap backdrop-blur"
                    >
                        <Sparkles className="w-3 h-3 shrink-0" />
                        <span className="hidden sm:inline">Prize</span> {formatINR(prizePool)}
                    </span>
                )}

                {isSoldOut && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/35">
                        <span className="-rotate-6 bg-white text-ink px-3 py-1 font-black text-xs sm:text-base uppercase tracking-widest border-2 border-ink shadow-lg">
                            Sold out
                        </span>
                    </div>
                )}
            </div>

            {/* Ticket perforation */}
            <div className="relative h-0" aria-hidden>
                <div className="absolute inset-x-3 border-t border-dashed border-brand-200" />
                <span className="absolute -left-2 -top-2 w-4 h-4 rounded-full bg-paper border border-brand-100" />
                <span className="absolute -right-2 -top-2 w-4 h-4 rounded-full bg-paper border border-brand-100" />
            </div>

            {/* Body */}
            <div className="flex flex-col flex-1 gap-2 sm:gap-2.5 p-2.5 sm:p-4 pt-3.5 sm:pt-5">
                {/* Fixed height: name + one notes line, so cards without notes still line up */}
                <div className="min-w-0 h-11 sm:h-14">
                    <h3 className="text-[15px] sm:text-lg font-extrabold text-ink capitalize truncate leading-tight">{pool.name}</h3>
                    <p className="text-xs sm:text-meta text-gray-500 truncate mt-0.5 h-4 sm:h-[1.125rem]">{pool.notes ?? "\u00A0"}</p>
                </div>

                <div className="flex items-baseline gap-1 text-ink">
                    <span className="text-sm sm:text-base font-bold text-brand-700">₹</span>
                    <span className="text-2xl sm:text-4xl font-black tracking-tight leading-none tabular-nums">{pool.perSeatPrice}</span>
                    <span className="text-xs sm:text-meta font-medium text-gray-500">/ seat</span>
                </div>

                {/* Seat fill */}
                <div>
                    <div
                        className="h-2 rounded-full bg-brand-100 ring-1 ring-inset ring-brand-200 overflow-hidden"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={total}
                        aria-valuenow={sold}
                        aria-label="Seats booked"
                    >
                        <div
                            className={`h-full rounded-full transition-all duration-700 ${isLow || isSoldOut ? "bg-gold-500" : "bg-brand-500"}`}
                            style={{ width: `${fillPct}%` }}
                        />
                    </div>
                    <p className={`mt-1 text-xs sm:text-meta font-semibold whitespace-nowrap truncate ${isLow ? "text-gold-700" : "text-gray-500"}`}>
                        {isSoldOut ? "All seats booked" : isLow ? `Only ${available} left` : `${available} of ${total} left`}
                    </p>
                </div>

                <p className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-meta text-gray-500">
                    <CalendarClock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-brand-600" />
                    <span className="truncate">
                        {formatDate(round?.startsAt)} – {formatDate(round?.endsAt)}
                    </span>
                </p>

                {/* CTA */}
                <div className="mt-auto pt-1 pb-1">
                    {isDrawing && round?.drawnAt ? (
                        <DrawingTimer drawnAt={round.drawnAt} compact />
                    ) : (
                        <div
                            className={`flex items-center justify-center gap-1 sm:gap-1.5 h-[42px] min-h-[42px] sm:h-[46px] sm:min-h-[46px] w-full rounded-xl text-sm sm:text-[15px] whitespace-nowrap ${
                                isSoldOut
                                    ? "bg-gray-100 text-gray-700 font-bold group-hover:bg-gray-200 transition-colors"
                                    : "btn-primary group-hover:-translate-y-px"
                            }`}
                        >
                            {isSoldOut ? (
                                "View seats"
                            ) : (
                                <>
                                    <span className="sm:hidden">Pick seats</span>
                                    <span className="hidden sm:inline">Pick your seats</span>
                                </>
                            )}
                            <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
