"use client";

import { IndianRupee, ArrowDownRight, ArrowUpRight, Ticket, Trophy, RotateCcw, Wrench, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type LedgerType = "BOOKING_PAYMENT" | "WINNER_PAYOUT" | "BOOKING_REFUND" | "MANUAL_CREDIT" | "MANUAL_DEBIT";
type LedgerDirection = "CREDIT" | "DEBIT";

interface LedgerEntry {
  publicId: string;
  type: LedgerType;
  direction: LedgerDirection;
  amount: string;
  balanceAfter: string;
  referenceType: string;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Plain-language label for what happened, written from the player's side of
// the counter, not the system's — matches what the entry actually paid for.
const ENTRY_COPY: Record<LedgerType, { label: string; icon: typeof Ticket }> = {
  BOOKING_PAYMENT: { label: "Ticket purchase", icon: Ticket },
  WINNER_PAYOUT: { label: "Prize payout", icon: Trophy },
  BOOKING_REFUND: { label: "Refund", icon: RotateCcw },
  MANUAL_CREDIT: { label: "Account credit", icon: Wrench },
  MANUAL_DEBIT: { label: "Account adjustment", icon: Wrench },
};

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function Rupee({ value }: { value: number }) {
  return (
    <span className="inline-flex items-baseline gap-0.5 tabular-nums">
      <IndianRupee className="w-[0.8em] h-[0.8em] relative top-[0.05em]" />
      {Math.abs(value).toLocaleString("en-IN")}
    </span>
  );
}

export default function WalletLedger({
  balance,
  entries,
  pagination,
}: {
  balance: string;
  entries: LedgerEntry[];
  pagination: Pagination;
}) {
  const balanceNum = parseFloat(balance || "0");
  const totalIn = entries
    .filter((e) => e.direction === "CREDIT")
    .reduce((acc, e) => acc + parseFloat(e.amount), 0);
  const totalOut = entries
    .filter((e) => e.direction === "DEBIT")
    .reduce((acc, e) => acc + parseFloat(e.amount), 0);

  return (
    <div className="space-y-8">
      {/* Balance stub — a ticket, not a card: perforation notches + a torn dashed seam */}
      <div className="relative bg-[#16261F] text-[#EFE7D4] rounded-sm overflow-hidden">
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#FAF8F2] dark:bg-gray-950" />
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#FAF8F2] dark:bg-gray-950" />

        <div className="grid sm:grid-cols-[1fr_auto] gap-6 sm:gap-0 p-7 sm:p-8">
          <div>
            <p className="font-serif text-sm text-[#B7A46B] mb-1">Net position</p>
            <div className="flex items-baseline gap-2">
              <span
                className={`font-mono text-4xl sm:text-5xl font-semibold tracking-tight ${
                  balanceNum < 0 ? "text-[#EFE7D4]" : "text-[#D8B45C]"
                }`}
              >
                {balanceNum < 0 ? "−" : ""}
                <Rupee value={balanceNum} />
              </span>
            </div>
            <p className="text-sm text-[#9CA893] mt-2 max-w-sm">
              {balanceNum >= 0
                ? "Prize payouts have outpaced what you've spent on tickets so far."
                : "What you've spent on tickets so far, minus what you've won back."}
            </p>
          </div>

          <div className="flex sm:flex-col gap-6 sm:gap-4 sm:border-l sm:border-dashed sm:border-[#3A4A40] sm:pl-8 justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#9CA893] mb-1">This page, in</p>
              <p className="font-mono text-lg text-emerald-300">
                <Rupee value={totalIn} />
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[#9CA893] mb-1">This page, out</p>
              <p className="font-mono text-lg text-[#E3A0A0]">
                <Rupee value={totalOut} />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ledger */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-lg text-gray-900 dark:text-white">Ledger</h2>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {pagination.total} {pagination.total === 1 ? "entry" : "entries"} on record
          </span>
        </div>

        {entries.length === 0 ? (
          <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-sm p-12 text-center">
            <Ticket className="w-6 h-6 text-gray-400 mx-auto mb-3" strokeWidth={1.5} />
            <h3 className="font-serif text-base text-gray-900 dark:text-white mb-1">No entries yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
              Every ticket you buy and every prize you win lands here. Book a seat to start your ledger.
            </p>
            <Link
              href="/games"
              className="inline-block mt-4 text-sm font-medium text-[#16261F] dark:text-[#D8B45C] underline underline-offset-4 decoration-dashed"
            >
              Browse open pools
            </Link>
          </div>
        ) : (
          <div className="border-t border-gray-200 dark:border-gray-800">
            {entries.map((entry, i) => {
              const meta = ENTRY_COPY[entry.type] ?? { label: entry.type, icon: Wrench };
              const Icon = meta.icon;
              const isCredit = entry.direction === "CREDIT";

              return (
                <div
                  key={entry.publicId}
                  className={`grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_auto_auto] items-center gap-4 py-4 border-b border-gray-200 dark:border-gray-800 ${
                    i % 2 === 1 ? "bg-gray-50/60 dark:bg-white/[0.02]" : ""
                  } px-3 -mx-3`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isCredit
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {meta.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {formatDate(entry.createdAt)} · {formatTime(entry.createdAt)}
                    </p>
                  </div>

                  <div className={`text-right font-mono text-sm font-semibold whitespace-nowrap ${
                    isCredit ? "text-emerald-700 dark:text-emerald-400" : "text-gray-700 dark:text-gray-300"
                  }`}>
                    <span className="inline-flex items-center gap-1">
                      {isCredit ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                      {isCredit ? "+" : "−"}
                      <Rupee value={parseFloat(entry.amount)} />
                    </span>
                  </div>

                  <div className="hidden sm:block text-right font-mono text-xs text-gray-400 whitespace-nowrap">
                    bal. <Rupee value={parseFloat(entry.balanceAfter)} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-6">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Link
                href={`/wallet?page=${pagination.page - 1}`}
                className={`p-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  !pagination.hasPrev ? "pointer-events-none opacity-40" : ""
                }`}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>
              <Link
                href={`/wallet?page=${pagination.page + 1}`}
                className={`p-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  !pagination.hasNext ? "pointer-events-none opacity-40" : ""
                }`}
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
