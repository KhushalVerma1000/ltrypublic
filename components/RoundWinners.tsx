"use client";

import { Trophy, Medal, User, Ticket } from "lucide-react";

interface Winner {
    id: number;
    position: number;
    prize: string;
    seat: {
        name: string;
        publicId: string;
    };
}

export default function RoundWinners({ winners }: { winners: Winner[] }) {
    if (!winners || winners.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Winners Not Declared</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                    The winners for this round have not been announced yet. Please check back later.
                </p>
            </div>
        );
    }

    // Sort winners by position
    const sortedWinners = [...winners].sort((a, b) => a.position - b.position);

    const getMedalColor = (position: number) => {
        switch (position) {
            case 1: return "text-amber-500";
            case 2: return "text-gray-400";
            case 3: return "text-amber-700";
            default: return "text-purple-400";
        }
    };

    const getBgColor = (position: number) => {
        switch (position) {
            case 1: return "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30";
            case 2: return "bg-gray-50 dark:bg-gray-900/10 border-gray-200 dark:border-gray-800/30";
            case 3: return "bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/30";
            default: return "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800";
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Trophy className="w-6 h-6 text-amber-500" />
                Round Winners
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sortedWinners.map((winner) => (
                    <div
                        key={winner.id}
                        className={`p-6 rounded-2xl border transition-all hover:shadow-lg ${getBgColor(winner.position)}`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm ${getMedalColor(winner.position)}`}>
                                <Medal className="w-6 h-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Position</p>
                                <p className="text-xl font-black text-gray-900 dark:text-white">#{winner.position}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <User className="w-5 h-5 text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Winning Seat</p>
                                    <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                        <Ticket className="w-3.5 h-3.5 text-purple-600" />
                                        Seat {winner.seat.name}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">Prize Won</p>
                                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                    ₹{parseFloat(winner.prize).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
