"use client";

import { Calendar, Ticket, CheckCircle2, Clock, AlertCircle, IndianRupee, Hash, Trophy, ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

interface Pool {
  name: string;
  publicId: string;
}

interface SeatDetails {
  publicId: string;
  round: {
    roundNumber: number;
    publicId: string;
    status: string;
    pool: Pool;
  };
}

interface BookedSeat {
  seatName: string;
  seat: SeatDetails;
}

interface Booking {
  id: string;
  amount: string;
  status: string; // PENDING, COMPLETED, FAILED
  userId: number;
  providerOrderId: string | null;
  createdAt: string;
  updatedAt: string;
  tokenexpiresAT: string;
  bookedSeats: BookedSeat[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function BookingHistory({ 
  bookings, 
  pagination 
}: { 
  bookings: Booking[], 
  pagination: Pagination 
}) {
  if (!bookings || bookings.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-12 text-center">
        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Ticket className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No bookings found</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
          You haven't booked any seats yet. Start your journey by picking a pool!
        </p>
      </div>
    );
  }

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyTicketId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      toast.success("Ticket ID copied");
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
    } catch {
      toast.error("Couldn't copy — long-press or select the ID manually");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
            <AlertCircle className="w-3 h-3" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-100 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Ticket className="w-5 h-5 text-purple-600" />
          Recent Bookings
        </h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Showing entries {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
        </span>
      </div>

      <div className="grid gap-4">
        {bookings.map((booking) => {
          // Get the pool name from the first seat's round if available
          const poolName = booking.bookedSeats?.[0]?.seat?.round?.pool?.name ?? "Unknown Pool";
          const roundNumber = booking.bookedSeats?.[0]?.seat?.round?.roundNumber;
          
          return (
            <div
              key={booking.id}
              className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 hover:shadow-md transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition-colors">
                      <Hash className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-mono text-gray-400 uppercase tracking-tighter">
                          ID: {booking.id.slice(-8)}
                        </p>
                        <button
                          type="button"
                          onClick={() => copyTicketId(booking.id)}
                          title="Copy full ticket ID — use it to check this ticket without logging in"
                          className="text-gray-400 hover:text-purple-600 transition-colors"
                        >
                          {copiedId === booking.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <div className="flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                          <Trophy className="w-3 h-3" />
                          {poolName} {roundNumber ? `(Round ${roundNumber})` : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                          {formatDate(booking.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {booking.bookedSeats?.map((bs) => (
                      <span
                        key={bs.seat.publicId}
                        className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                      >
                        SEAT {bs.seatName}
                      </span>
                    ))}
                    {(!booking.bookedSeats || booking.bookedSeats.length === 0) && (
                      <span className="text-xs text-gray-400 italic">No seats assigned</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 dark:border-gray-800">
                  <div className="text-right">
                    <div className="flex items-center md:justify-end gap-1 text-lg font-bold text-gray-900 dark:text-white">
                      <IndianRupee className="w-4 h-4" />
                      {booking.amount}
                    </div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                      Total Paid
                    </p>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-6">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Page <span className="font-medium text-gray-900 dark:text-white">{pagination.page}</span> of <span className="font-medium text-gray-900 dark:text-white">{pagination.totalPages}</span>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/dashboard?page=${pagination.page - 1}`}
              className={`p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!pagination.hasPrev ? 'pointer-events-none opacity-40' : ''}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <Link
              href={`/dashboard?page=${pagination.page + 1}`}
              className={`p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!pagination.hasNext ? 'pointer-events-none opacity-40' : ''}`}
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}


