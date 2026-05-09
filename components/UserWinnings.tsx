"use client";

import { Trophy, IndianRupee, Calendar, Hash, CheckCircle2, Clock } from "lucide-react";

interface Winner {
  id: number;
  position: number;
  prize: string;
  paid: boolean;
  paidAt: string | null;
  createdAt: string;
  seat: {
    name: string;
    round: {
      roundNumber: number;
      pool: {
        name: string;
      };
    };
  };
}

export default function UserWinnings({ winnings }: { winnings: Winner[] }) {
  if (!winnings || winnings.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-12 text-center">
        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No winnings yet</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
          Keep playing and your big wins will show up here!
        </p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-emerald-600" />
          Your Winnings
        </h2>
      </div>

      <div className="grid gap-4">
        {winnings.map((winner) => (
          <div
            key={winner.id}
            className="group bg-white dark:bg-gray-900 border border-emerald-100/50 dark:border-emerald-900/20 rounded-xl p-5 hover:shadow-md transition-all duration-300 relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/10 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 blur-2xl" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors">
                    <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                        Position #{winner.position}
                      </p>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {winner.seat.round.pool.name} (Round {winner.seat.round.roundNumber})
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-gray-900 dark:text-white font-bold">
                      SEAT {winner.seat.name}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(winner.createdAt)}
                  </div>
                  <div className="flex items-center gap-1">
                    {winner.paid ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Payout Sent
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <Clock className="w-3 h-3" /> Payout Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end justify-center border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  <IndianRupee className="w-5 h-5 stroke-[3]" />
                  {parseFloat(winner.prize).toLocaleString()}
                </div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                  Winning Prize
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
