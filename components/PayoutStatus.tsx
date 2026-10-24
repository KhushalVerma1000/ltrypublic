import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

export type PayoutVerification = "UNVERIFIED" | "VERIFIED" | "REJECTED";

interface Props {
  status: PayoutVerification | null;
  reason?: string | null;
  hasUnpaidWinnings?: boolean;
}

// Tells the player where their payout details stand. Winning is never blocked;
// only the payout waits for a manual check of the bank/UPI details.
export default function PayoutStatus({ status, reason, hasUnpaidWinnings = false }: Props) {
  if (!status) return null;

  if (status === "VERIFIED") {
    return (
      <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/10 p-3">
        <ShieldCheck className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Payout details verified</p>
          <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">Your prizes can be paid out.</p>
        </div>
      </div>
    );
  }

  if (status === "REJECTED") {
    return (
      <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-900/10 p-3">
        <ShieldX className="w-4 h-4 mt-0.5 text-red-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-800 dark:text-red-300">Payout details need attention</p>
          <p className="text-xs text-red-700/90 dark:text-red-400/90">
            {reason?.trim() || "We couldn't verify your bank or UPI details."} Please contact support to correct them.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/10 p-3">
      <ShieldAlert className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
      <div>
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Payout details under review</p>
        <p className="text-xs text-amber-700/90 dark:text-amber-400/90">
          {hasUnpaidWinnings
            ? "Your prize is on hold until we check your bank/UPI details. This is a one-time check before your first payout."
            : "We check your bank/UPI details once, before your first payout. Nothing is needed from you right now."}
        </p>
      </div>
    </div>
  );
}
