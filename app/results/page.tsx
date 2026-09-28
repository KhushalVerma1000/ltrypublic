import { cookies } from "next/headers";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import TicketLookup from "@/components/TicketLookup";
import { Trophy, Calendar, Hash, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

interface Pool {
    publicId: string;
    name: string;
    perSeatPrice: string;
    totalSeats: number;
}

async function getPools(): Promise<Pool[]> {
    try {
        const res = await fetch(`${process.env.API_URL}/pools`, {
            next: { revalidate: 60 }
        });
        if (!res.ok) return [];
        
        const data = await res.json();
        return data.success && Array.isArray(data.data) ? data.data : [];
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

export default async function ResultsPage() {
    const pools = await getPools();
    
    // Check if user is logged in
    const cookieStore = await cookies();
    const isLoggedIn = !!cookieStore.get("accessToken");

    // Fetch winners for all pools (in parallel)
    const poolsWithWinners = await Promise.all(
        pools.map(async (pool) => {
            const winners = await getPoolWinners(pool.publicId);
            
            // Group winners by round
            const roundsMap = new Map();
            winners.forEach((w: any) => {
                if (!w.round) return;
                const roundNum = w.round.roundNumber;
                if (!roundsMap.has(roundNum)) {
                    roundsMap.set(roundNum, {
                        roundNumber: roundNum,
                        publicId: w.round.publicId,
                        winners: []
                    });
                }
                roundsMap.get(roundNum).winners.push(w);
            });
            
            // Convert to array and sort by roundNumber descending
            const groupedRounds = Array.from(roundsMap.values()).sort((a, b) => b.roundNumber - a.roundNumber);
            
            return { ...pool, groupedRounds };
        })
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Navbar isLoggedIn={isLoggedIn} />

            {/* pt-[132px] = 96px original spacing + 36px reserved for Navbar's next-draw strip */}
            <div className="pt-[132px] pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="mb-12 text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold mb-3">
                            <Trophy size={12} className="fill-blue-600" />
                            <span>Official Results</span>
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Draw Results
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                            Check out the latest winners from all our lottery draws. 
                            Transparency is our core value.
                        </p>
                    </div>

                    <div className="max-w-xl mx-auto mb-12">
                        <TicketLookup />
                    </div>

                    <div className="space-y-8">
                        {poolsWithWinners.length === 0 ? (
                            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-12 text-center">
                                <p className="text-gray-500 dark:text-gray-400">No pools found.</p>
                            </div>
                        ) : (
                            poolsWithWinners.map((pool) => (
                                <div key={pool.publicId} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
                                    <div className="p-6 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                <Trophy className="w-5 h-5 text-amber-500" />
                                                {pool.name}
                                            </h2>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest font-semibold">
                                                Pool ID: {pool.publicId.slice(-8)}
                                            </p>
                                        </div>
                                        <Link 
                                            href={`/pools/${pool.publicId}`}
                                            className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-xl transition-colors hover:bg-purple-100 dark:hover:bg-purple-900/40"
                                        >
                                            View active round <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>

                                    <div className="p-6">
                                        {pool.groupedRounds.length === 0 ? (
                                            <div className="py-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-100">
                                                <p className="text-sm text-gray-400 italic">No winners announced yet for this pool.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                {pool.groupedRounds.map((round: any) => (
                                                    <div key={round.roundNumber} className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                                                        {/* Round Header */}
                                                        <div className="bg-gray-50/80 dark:bg-gray-800/30 px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                                            <div className="flex items-center gap-2">
                                                                <Hash className="w-4 h-4 text-gray-400" />
                                                                <span className="font-bold text-gray-800 dark:text-gray-200">
                                                                    Round {round.roundNumber}
                                                                </span>
                                                            </div>
                                                            <span className="text-xs text-gray-400 font-medium bg-white dark:bg-gray-800 px-2.5 py-1 rounded-md border border-gray-100 dark:border-gray-700 shadow-sm">
                                                                {round.winners.length} Winners
                                                            </span>
                                                        </div>

                                                        {/* Round Winners Table */}
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-left">
                                                                <thead>
                                                                    <tr className="text-[10px] uppercase tracking-wider text-gray-400 bg-white dark:bg-gray-900 border-b border-gray-50 dark:border-gray-800">
                                                                        <th className="px-5 py-3 font-semibold">Rank</th>
                                                                        <th className="px-5 py-3 font-semibold">Seat</th>
                                                                        <th className="px-5 py-3 font-semibold">Status</th>
                                                                        <th className="px-5 py-3 font-semibold text-right">Prize</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800 bg-white dark:bg-gray-900">
                                                                    {round.winners.map((winner: any) => (
                                                                        <tr key={winner.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                                                            <td className="px-5 py-4">
                                                                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black shadow-sm ${
                                                                                    winner.position === 1 ? 'bg-amber-500 text-white shadow-amber-500/20' :
                                                                                    winner.position === 2 ? 'bg-slate-400 text-white shadow-slate-400/20' :
                                                                                    winner.position === 3 ? 'bg-amber-700 text-white shadow-amber-700/20' :
                                                                                    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                                                }`}>
                                                                                    {winner.position === 1 ? '1' : winner.position}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-5 py-4">
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-sm font-mono font-bold text-gray-900 dark:text-white">
                                                                                        {winner.seat?.name}
                                                                                    </span>
                                                                                    <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">Ticket Holder</span>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-5 py-4">
                                                                                {winner.paid ? (
                                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                                                                        Paid out
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                                                                                        Pending
                                                                                    </span>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-5 py-4 text-right">
                                                                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                                                                    ₹{parseFloat(winner.prize).toLocaleString()}
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

 