import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { DrawingTimer } from "@/components/DrawingTimer";
import { ArrowRight, Calendar, Clock, Ticket, Users, Zap, Trophy, Crown, Star } from "lucide-react";

export const dynamic = "force-dynamic";

interface Pool {
    publicId: string;
    name: string;
    perSeatPrice: string;
    notes: string | null;
    activeRound: {
        roundNumber: number;
        publicId: string;
        status: string;
        startsAt: string;
        endsAt: string;
        drawnAt: string | null;
        availableSeats: number;
    } | null;
}

async function getPools(): Promise<Pool[]> {
    try {
        const res = await fetch(`${process.env.API_URL}/pools`, {
            cache: 'no-store',
            next: { revalidate: 0 }
        });
        if (!res.ok) return [];

        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
            return data.data.filter((pool: Pool) => pool.activeRound !== null);
        }
        return [];
    } catch (e) {
        console.error("Error fetching pools:", e);
        return [];
    }
}

async function getPoolWinners(poolId: string) {
    try {
        const res = await fetch(`${process.env.API_URL}/winners/${poolId}`, {
            next: { revalidate: 60 }
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.success ? data.data : [];
    } catch (e) {
        console.error(`Error fetching winners for pool ${poolId}:`, e);
        return [];
    }
}

export default async function GamesPage() {
    const pools = await getPools();
    const cookieStore = await cookies();
    const isLoggedIn = !!cookieStore.get("accessToken");

    // Fetch winners for all pools in parallel
    const poolsWithWinners = await Promise.all(
        pools.map(async (pool) => {
            const winners = await getPoolWinners(pool.publicId);
            return {
                id: pool.publicId,
                name: pool.name,
                winners: winners.slice(0, 5) // Limit to top 5 recent/highest winners
            };
        })
    );

    const styling = [
        {
            gradient: "from-[#4F46E5] via-[#4338CA] to-[#312E81]",
            accent: "bg-indigo-500/20 border-indigo-400/30 text-indigo-200",
            shadow: "shadow-indigo-900/30 hover:shadow-indigo-500/25",
            border: "border-indigo-500/20"
        },
        {
            gradient: "from-[#F59E0B] via-[#D97706] to-[#78350F]",
            accent: "bg-amber-500/20 border-amber-400/30 text-amber-200",
            shadow: "shadow-amber-900/30 hover:shadow-amber-500/25",
            border: "border-amber-500/20"
        },
        {
            gradient: "from-[#E11D48] via-[#BE123C] to-[#4C0519]",
            accent: "bg-rose-500/20 border-rose-400/30 text-rose-200",
            shadow: "shadow-rose-900/30 hover:shadow-rose-500/25",
            border: "border-rose-500/20"
        },
        {
            gradient: "from-[#10B981] via-[#047857] to-[#064E3B]",
            accent: "bg-emerald-500/20 border-emerald-400/30 text-emerald-200",
            shadow: "shadow-emerald-900/30 hover:shadow-emerald-500/25",
            border: "border-emerald-500/20"
        }
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Navbar isLoggedIn={isLoggedIn} />

            {/* Hero Section */}
            {/* +36px reserved for Navbar's persistent next-draw strip */}
            <div className="pt-[132px] sm:pt-[164px] pb-12 px-4 sm:px-6 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
                </div>

                <div className="max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-6 animate-fade-in">
                        <Zap size={14} className="fill-blue-600" />
                        <span>Live Games Available Now</span>
                    </div>
                    <h1 className="text-5xl sm:text-7xl font-black text-gray-900 tracking-tight mb-6 leading-[1.1]">
                        Refer Fast To <br />
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">Reveal The Winner</span>
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
                        Join the most exciting community pools. Pick your seat, wait for the draw, and win big! Every seat brings you closer to the grand prize.
                    </p>
                </div>

                {/* Pool Grid */}
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 md:gap-6">
                        {pools.length === 0 ? (
                            <div className="col-span-full text-center py-24 bg-white/50 backdrop-blur-sm border border-gray-100 rounded-3xl shadow-sm">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Ticket className="text-gray-300" size={32} />
                                </div>
                                <p className="text-gray-500 font-medium text-lg">
                                    No active pools available at the moment.
                                </p>
                                <p className="text-gray-400 text-sm mt-1">Please check back later for new opportunities.</p>
                            </div>
                        ) : (
                            pools.map((pool, index) => {
                                const style = styling[index % styling.length];
                                const isSoldOut = (pool.activeRound?.availableSeats ?? 0) <= 0;
                                const availableSeats = pool.activeRound?.availableSeats ?? 0;
                                const digits = String(availableSeats).padStart(3, '0').split('');

                                const price = parseInt(pool.perSeatPrice);
                                let poolImage = "/poolimages/200.png";
                                if (price > 700) {
                                    poolImage = "/poolimages/1000.png";
                                } else if (price >= 300) {
                                    poolImage = "/poolimages/500.png";
                                }

                                const roundStatus = pool.activeRound?.status ?? "UPCOMING";
                                const statusLabel = roundStatus === "DRAWING" ? "Drawing Live" : roundStatus === "UPCOMING" ? "Upcoming" : "Active";

                                const poolUrl = `/pools/${pool.publicId}`;
                                const targetUrl = isLoggedIn ? poolUrl : `/login?redirect=${encodeURIComponent(poolUrl)}`;

                                return (
                                    <Link
                                        href={targetUrl}
                                        key={pool.publicId}
                                        className={`group relative w-full flex flex-col bg-gradient-to-br ${style.gradient} rounded-2xl md:rounded-3xl p-[1px] shadow-xl ${style.shadow} transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1 overflow-hidden ${isSoldOut ? 'opacity-70 grayscale-[0.5] cursor-not-allowed' : ''}`}
                                        style={{ pointerEvents: isSoldOut ? 'none' : 'auto' }}
                                    >
                                        {/* Subtle Light Reflection overlay */}
                                        <div className="absolute inset-0 bg-linear-to-tr from-white/0 via-white/5 to-white/10 opacity-60 pointer-events-none" />

                                        {/* Inner Unified Container */}
                                        <div className="relative flex flex-col w-full h-full bg-black/15 backdrop-blur-lg rounded-[15px] md:rounded-[23px] overflow-hidden">

                                            {/* Main Content Area - Landscape */}
                                            <div className="flex flex-row w-full flex-1 relative z-10">
                                                {/* Left Info Section */}
                                                <div className="w-[65%] sm:w-[58%] p-2.5 sm:p-4 md:p-5 flex flex-col justify-between min-w-0">
                                                    <div>
                                                        {/* Status + Round */}
                                                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5 sm:mb-2">
                                                            <span className={`px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full border text-[7px] sm:text-[9px] font-bold uppercase tracking-wider ${roundStatus === "DRAWING"
                                                                    ? "bg-red-500/20 border-red-500/40 text-red-200 animate-pulse"
                                                                    : roundStatus === "UPCOMING"
                                                                        ? "bg-amber-500/20 border-amber-400/30 text-amber-200"
                                                                        : "bg-white/10 border-white/20 text-white"
                                                                }`}>
                                                                {statusLabel}
                                                            </span>
                                                            <span className="px-1.5 py-0.5 sm:px-2 rounded-full bg-white/10 border border-white/15 text-white/60 text-[7px] sm:text-[9px] font-semibold">
                                                                R#{pool.activeRound?.roundNumber}
                                                            </span>
                                                        </div>

                                                        {/* Pool Name */}
                                                        <h3 className="text-white/90 text-[10px] sm:text-[11px] md:text-xs font-black uppercase tracking-wider mb-0.5 sm:mb-1 truncate">{pool.name}</h3>

                                                        {/* Notes */}
                                                        {pool.notes && (
                                                            <p className="text-white/50 text-[8px] sm:text-[9px] italic truncate mb-1">
                                                                {pool.notes}
                                                            </p>
                                                        )}

                                                        {/* Price */}
                                                        <div className="flex items-baseline gap-0.5 text-white mb-2 sm:mb-3 mt-1">
                                                            <span className="text-[10px] sm:text-sm font-light opacity-80">₹</span>
                                                            <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-none">{pool.perSeatPrice}</span>
                                                            <span className="text-[7px] sm:text-[10px] font-medium opacity-50 ml-0.5">/ seat</span>
                                                        </div>
                                                    </div>

                                                    {/* Seats + CTA (Side-by-side on mobile, stacked on desktop) */}
                                                    <div className="flex flex-row sm:flex-col items-end sm:items-start justify-between sm:justify-start gap-1.5 sm:gap-2.5">
                                                        <div>
                                                            <p className="flex text-white/60 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest mb-1 items-center gap-1">
                                                                <Users size={8} className="sm:w-2.5 sm:h-2.5" />
                                                                Seats
                                                            </p>
                                                            <div className="flex gap-0.5 sm:gap-1">
                                                                {digits.map((digit, i) => (
                                                                    <div
                                                                        key={i}
                                                                        className="relative w-5 h-6 sm:w-7 sm:h-8 md:w-8 md:h-9 bg-slate-950/60 border border-white/10 rounded sm:rounded-md flex items-center justify-center text-[11px] sm:text-sm md:text-base font-extrabold text-white shadow-sm shadow-black/20 overflow-hidden group-hover:-translate-y-0.5 transition-all duration-300"
                                                                    >
                                                                        <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-white/5 z-10" />
                                                                        <span className="relative z-0 leading-none">{digit}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="sm:pt-1">
                                                            {roundStatus === "DRAWING" && pool.activeRound?.drawnAt ? (
                                                                <div className="bg-white rounded-md shadow-md overflow-hidden">
                                                                    <DrawingTimer drawnAt={pool.activeRound.drawnAt} />
                                                                </div>
                                                            ) : (
                                                                <div className="inline-flex items-center gap-0.5 px-2 py-1 sm:px-3 sm:py-1.5 bg-white text-gray-900 rounded-full font-bold text-[9px] sm:text-[10px] transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:scale-[1.04]">
                                                                    <span>{isSoldOut ? 'Sold Out' : 'Join'}</span>
                                                                    {!isSoldOut && <ArrowRight size={10} className="sm:w-3 sm:h-3 text-gray-900 transition-transform duration-300 group-hover:translate-x-0.5" />}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="flex items-center gap-3 sm:gap-4 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-black/25 border-t border-white/5 relative z-10">
                                                <span className="flex items-center gap-1 text-white/40 text-[7px] sm:text-[8px] font-semibold uppercase tracking-wider">
                                                    <Clock size={8} className="opacity-60" />
                                                    {new Date(pool.activeRound?.startsAt ?? "").toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </span>
                                                <span className="flex items-center gap-1 text-white/40 text-[7px] sm:text-[8px] font-semibold uppercase tracking-wider">
                                                    <Calendar size={8} className="opacity-60" />
                                                    {new Date(pool.activeRound?.endsAt ?? "").toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>

                                            {/* Absolute Right Image Section */}
                                            <div className="absolute right-0 bottom-0 w-[42%] h-[95%] sm:w-[45%] sm:h-[100%] flex items-end justify-end pointer-events-none z-20 overflow-visible">
                                                <div className="relative w-full h-full transition-transform duration-700 group-hover:scale-[1.05] origin-bottom-right">
                                                    <Image
                                                        src={poolImage}
                                                        alt="Pool Illustration"
                                                        fill
                                                        sizes="(max-width: 640px) 42vw, 45vw"
                                                        className="object-contain object-bottom pr-1.5 sm:pr-3 drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)] sm:drop-shadow-[0_6px_15px_rgba(0,0,0,0.4)]"
                                                        priority
                                                    />
                                                </div>
                                                {/* Decorative glow */}
                                                <div className="absolute bottom-0 right-0 w-[80%] h-[50%] bg-white/10 rounded-full blur-2xl -z-10" />
                                            </div>
                                        </div>

                                        {/* Sold Out Overlay */}
                                        {isSoldOut && (
                                            <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center overflow-hidden rounded-2xl md:rounded-3xl">
                                                <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]" />
                                                <div className="relative rotate-[-12deg] bg-white text-gray-900 px-3 py-1 sm:px-6 sm:py-2 font-black text-[10px] sm:text-lg uppercase tracking-widest shadow-xl border-2 border-gray-900">
                                                    Sold Out
                                                </div>
                                            </div>
                                        )}
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Pool-Wise Winner Boards Section */}
                <div className="max-w-6xl mx-auto mt-24 mb-16 px-4 sm:px-6">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-xs font-semibold mb-3">
                            <Trophy size={12} className="fill-amber-500 text-amber-500" />
                            <span>Winner Board</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                            Pool Winner Board
                        </h2>
                        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                            Meet our recent seat champions and top prize winners from each pool.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                        {poolsWithWinners.map((poolData, pIdx) => {
                            const style = styling[pIdx % styling.length];
                            
                            return (
                                <div key={poolData.id} className="relative bg-white border border-gray-100/70 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-100/40 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50">
                                    {/* Top decorative gradient blur background */}
                                    <div className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-br ${style.gradient} opacity-[0.03] blur-3xl pointer-events-none`} />
                                    
                                    <div>
                                        {/* Winner Board Header */}
                                        <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center text-white shadow-md`}>
                                                    <Trophy size={16} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-sm sm:text-base uppercase tracking-wider">{poolData.name}</h3>
                                                    <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest">Hall of Fame</p>
                                                </div>
                                            </div>
                                            <Link href={`/pools/${poolData.id}`} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 group">
                                                Play Round <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                                            </Link>
                                        </div>

                                        {/* Winner Board Entries */}
                                        {poolData.winners.length === 0 ? (
                                            <div className="py-14 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-100">
                                                <Star className="mx-auto text-slate-300 mb-2.5 animate-pulse" size={20} />
                                                <p className="text-xs text-slate-400 italic">No winners announced yet for this pool.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {poolData.winners.map((winner: any) => {
                                                    const position = winner.position;
                                                    
                                                    const rowBg = position === 1 
                                                        ? 'bg-amber-500/5 hover:bg-amber-500/8 border-amber-500/10' 
                                                        : position === 2 
                                                        ? 'bg-slate-400/5 hover:bg-slate-400/8 border-slate-400/10' 
                                                        : position === 3 
                                                        ? 'bg-amber-700/5 hover:bg-amber-700/8 border-amber-700/10' 
                                                        : 'bg-slate-50/30 hover:bg-slate-50/70 border-slate-100';

                                                    const rankBadge = position === 1 
                                                        ? 'bg-amber-500 text-white shadow-amber-500/20' 
                                                        : position === 2 
                                                        ? 'bg-slate-400 text-white shadow-slate-400/20' 
                                                        : position === 3 
                                                        ? 'bg-amber-700 text-white shadow-amber-700/20' 
                                                        : 'bg-slate-100 text-slate-500';

                                                    return (
                                                        <div 
                                                            key={winner.id}
                                                            className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all duration-300 hover:scale-[1.01] ${rowBg}`}
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                {/* Rank Indicator */}
                                                                <div className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center font-black text-xs shadow-sm shrink-0 ${rankBadge}`}>
                                                                    {position === 1 ? <Crown size={11} className="fill-white" /> : position}
                                                                </div>
                                                                
                                                                {/* Winner Details */}
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-xs font-mono font-bold text-gray-900 truncate">Seat {winner.seat?.name}</span>
                                                                        <span className="text-[9px] text-gray-400 font-medium shrink-0">R#{winner.round?.roundNumber}</span>
                                                                    </div>
                                                                    <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Ticket Holder</p>
                                                                </div>
                                                            </div>

                                                            {/* Prize Amount */}
                                                            <div className="text-right shrink-0">
                                                                <span className="text-xs sm:text-sm font-black text-emerald-600">
                                                                    ₹{parseFloat(winner.prize).toLocaleString()}
                                                                </span>
                                                                <p className="text-[8px] text-gray-400 font-semibold uppercase tracking-wider">Won Prize</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.8s ease-out forwards;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                .animate-float {
                    animation: float 4s ease-in-out infinite;
                }
            `}} />
        </div>
    );
}
