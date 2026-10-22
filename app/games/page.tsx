import { cookies } from "next/headers";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import PoolCard, { CARD_TINTS, type PoolCardData } from "@/components/PoolCard";
import { ArrowRight, Ticket, Zap, Trophy, Crown, Star } from "lucide-react";

export const dynamic = "force-dynamic";

// Celebratory illustrations shown on pool cards. To use real photos instead,
// drop cut-out (transparent) PNG/WEBP files in /public/cardimages and list
// them here — the cards pick one per pool in order.
const CARD_IMAGES = [
    "/cardimages/family.svg",
    "/cardimages/man.svg",
    "/cardimages/couple.svg",
];

type Pool = PoolCardData;

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

    return (
        <div className="min-h-screen bg-paper">
            <Navbar isLoggedIn={isLoggedIn} />

            {/* +36px reserved for Navbar's persistent next-draw strip */}
            <div className="pt-[124px] sm:pt-[164px] pb-12 px-3 sm:px-6 relative overflow-hidden">
                {/* Hero */}
                <div className="max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-100 border border-gold-200 text-gold-700 text-xs sm:text-sm font-semibold mb-4 sm:mb-6 animate-fade-in">
                        <Zap size={14} className="fill-gold-500 text-gold-500" />
                        <span>Live games available now</span>
                    </div>
                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-ink tracking-tight mb-4 sm:mb-6 leading-[1.08]">
                        Pick a seat. <br />
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-brand-600 to-brand-400">Reveal the winner.</span>
                    </h1>
                    <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mb-8 sm:mb-10">
                        Join community pools, choose your seats and wait for the draw. Every seat brings you closer to the grand prize.
                    </p>
                </div>

                {/* Pool grid — always two columns on mobile */}
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6 items-stretch">
                        {pools.length === 0 ? (
                            <div className="col-span-full text-center py-20 bg-white border border-brand-100 rounded-3xl shadow-card">
                                <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Ticket className="text-brand-300" size={32} />
                                </div>
                                <p className="text-gray-600 font-semibold text-lg">No active pools right now.</p>
                                <p className="text-gray-400 text-sm mt-1">Please check back soon for new rounds.</p>
                            </div>
                        ) : (
                            pools.map((pool, index) => (
                                <PoolCard
                                    key={pool.publicId}
                                    pool={pool}
                                    image={CARD_IMAGES[index % CARD_IMAGES.length]}
                                    tint={CARD_TINTS[index % CARD_TINTS.length]}
                                    priority={index < 2}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Pool-Wise Winner Boards Section */}
                <div className="max-w-6xl mx-auto mt-16 sm:mt-24 mb-12 px-0 sm:px-6">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-100 border border-gold-200 text-gold-700 text-xs font-semibold mb-3">
                            <Trophy size={12} className="fill-gold-500 text-gold-500" />
                            <span>Winner Board</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-ink tracking-tight">
                            Pool Winner Board
                        </h2>
                        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                            Meet our recent seat champions and top prize winners from each pool.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                        {poolsWithWinners.map((poolData) => {
                            return (
                                <div key={poolData.id} className="relative bg-white border border-brand-100 rounded-3xl p-4 sm:p-6 shadow-card overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50">
                                    
                                    <div>
                                        {/* Winner Board Header */}
                                        <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-9 h-9 rounded-xl bg-brand-700 flex items-center justify-center text-gold-300 shadow-md`}>
                                                    <Trophy size={16} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-ink text-sm sm:text-base uppercase tracking-wider">{poolData.name}</h3>
                                                    <p className="text-2xs text-gray-400 font-semibold uppercase tracking-widest">Hall of Fame</p>
                                                </div>
                                            </div>
                                            <Link href={`/pools/${poolData.id}`} className="text-xs font-bold text-brand-700 hover:text-brand-800 transition-colors flex items-center gap-1 group">
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
                                                                        <span className="text-xs font-mono font-bold text-ink truncate">Seat {winner.seat?.name}</span>
                                                                        <span className="text-2xs text-gray-400 font-medium shrink-0">R#{winner.round?.roundNumber}</span>
                                                                    </div>
                                                                    <p className="text-2xs text-gray-400 font-semibold uppercase tracking-wider">Ticket Holder</p>
                                                                </div>
                                                            </div>

                                                            {/* Prize Amount */}
                                                            <div className="text-right shrink-0">
                                                                <span className="text-xs sm:text-sm font-black text-brand-700">
                                                                    ₹{parseFloat(winner.prize).toLocaleString()}
                                                                </span>
                                                                <p className="text-2xs text-gray-400 font-semibold uppercase tracking-wider">Won Prize</p>
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
