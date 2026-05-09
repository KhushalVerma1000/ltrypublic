import { cookies } from "next/headers";
import Link from "next/link";
import Navbar from "@/components/Navbar";
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
            return { ...pool, winners };
        })
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Navbar isLoggedIn={isLoggedIn} />

            <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="mb-12 text-center">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Draw Results
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                            Check out the latest winners from all our lottery draws. 
                            Transparency is our core value.
                        </p>
                    </div>

                    <div className="space-y-8">
                        {poolsWithWinners.length === 0 ? (
                            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-12 text-center">
                                <p className="text-gray-500 dark:text-gray-400">No pools found.</p>
                            </div>
                        ) : (
                            poolsWithWinners.map((pool) => (
                                <div key={pool.publicId} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
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
                                            className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                                        >
                                            View active round <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>

                                    <div className="p-6">
                                        {pool.winners.length === 0 ? (
                                            <div className="py-8 text-center">
                                                <p className="text-sm text-gray-400 italic">No winners announced yet for this pool.</p>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead>
                                                        <tr className="text-xs uppercase tracking-wider text-gray-400 border-b border-gray-50 dark:border-gray-800">
                                                            <th className="pb-3 font-semibold">Round</th>
                                                            <th className="pb-3 font-semibold">Rank</th>
                                                            <th className="pb-3 font-semibold">Seat</th>
                                                            <th className="pb-3 font-semibold text-right">Prize</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                                        {pool.winners.map((winner: any) => (
                                                            <tr key={winner.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                                                <td className="py-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <Hash className="w-3.5 h-3.5 text-gray-300" />
                                                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                                                            Round {winner.round?.roundNumber}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-4">
                                                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                                                        winner.position === 1 ? 'bg-amber-100 text-amber-700' :
                                                                        winner.position === 2 ? 'bg-gray-100 text-gray-700' :
                                                                        winner.position === 3 ? 'bg-orange-100 text-orange-700' :
                                                                        'bg-purple-50 text-purple-700'
                                                                    }`}>
                                                                        {winner.position}
                                                                    </span>
                                                                </td>
                                                                <td className="py-4">
                                                                    <span className="text-sm font-mono font-bold text-gray-900 dark:text-white">
                                                                        {winner.seat?.name}
                                                                    </span>
                                                                </td>
                                                                <td className="py-4 text-right">
                                                                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                                        ₹{parseFloat(winner.prize).toLocaleString()}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
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
