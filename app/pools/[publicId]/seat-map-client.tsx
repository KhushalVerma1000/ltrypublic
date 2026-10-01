"use client"

import { useState, useActionState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import SeatMap, { Seat } from "@/components/SeatMap"
import { ReservationCountdown } from "@/components/ReservationCountdown"
import { bookSeatsAction, verifyPaymentAction, paymentFailureAction, paymentDismissAction } from "./action"
import { useUser } from "@/app/context/UserContext"
import { toast } from "sonner"
import { CheckCircle2, Ticket, ArrowRight } from "lucide-react"

const SELECTION_STORAGE_KEY = "ltry:pending-seat-selection"

export default function SeatMapClient({
    seats,
    roundId,
    perSeatPrice,
    isLoggedIn,
    isReadOnly = false,
    poolName,
    roundNumber
}: {
    seats: Seat[],
    roundId: string,
    perSeatPrice: number,
    isLoggedIn: boolean,
    isReadOnly?: boolean,
    poolName?: string,
    roundNumber?: number
}) {
    const router = useRouter();
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [liveSeats, setLiveSeats] = useState<Seat[]>(seats)
    const [isVerifying, setIsVerifying] = useState(false)
    const [reservationExpired, setReservationExpired] = useState(false)
    const [confirmed, setConfirmed] = useState<{ seatNames: string[]; amount: number } | null>(null)
    const [state, formAction, isPending] = useActionState(bookSeatsAction, undefined)
    const user = useUser()

    // Keep the board in sync with other players. Seats are only fetched
    // server-side on page load otherwise, so two people could both select a
    // seat someone else has already taken and only find out at payment time.
    // Paused once this player has their own reservation in flight, so their
    // held seats don't visually flicker mid-checkout.
    useEffect(() => {
        if (isReadOnly) return;
        const interval = setInterval(async () => {
            if (state?.success) return; // mid-checkout — don't disturb the view
            try {
                const res = await fetch(`/api/seats/${roundId}`, { cache: "no-store" });
                const data = await res.json();
                if (data?.success && Array.isArray(data.data)) {
                    setLiveSeats(data.data);
                    const takenByOthers = data.data.filter(
                        (s: Seat) => selectedIds.includes(s.publicId) && s.status !== "AVAILABLE"
                    );
                    if (takenByOthers.length > 0) {
                        setSelectedIds(prev => prev.filter(id => !takenByOthers.some((s: Seat) => s.publicId === id)));
                        toast(`${takenByOthers.map((s: Seat) => s.name).join(", ")} just got booked by someone else — deselected for you.`);
                    }
                }
            } catch { /* transient network hiccup, try again next tick */ }
        }, 12000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roundId, isReadOnly, state?.success, selectedIds]);

    // A payment dismiss/cancel still needs a page reload today (a fresh
    // booking + Razorpay order has to be created for a retry), but the
    // player's seat picks shouldn't vanish because of that. Stash them
    // across the reload instead of making the player start over.
    useEffect(() => {
        const saved = typeof window !== "undefined" ? sessionStorage.getItem(SELECTION_STORAGE_KEY) : null;
        if (saved) {
            try {
                const parsed: string[] = JSON.parse(saved);
                const stillValid = parsed.filter(id => seats.some(s => s.publicId === id && s.status !== "SOLD"));
                if (stillValid.length > 0) setSelectedIds(stillValid);
            } catch { /* ignore malformed storage */ }
            sessionStorage.removeItem(SELECTION_STORAGE_KEY);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const MAX_SEATS = 4;

    const toggleSeat = (seat: Seat) => {
        if (isReadOnly) return;
        setSelectedIds(prev => {
            if (prev.includes(seat.publicId)) {
                return prev.filter(id => id !== seat.publicId)
            } else {
                if (prev.length >= MAX_SEATS) {
                    toast.error("Up to 4 seats per booking — deselect one to add another")
                    return prev
                }
                return [...prev, seat.publicId]
            }
        })
    }

    // "Pick for me" — a seat-based Easy Pick. Randomly selects N seats that
    // are AVAILABLE right now in liveSeats (not the stale initial `seats`
    // prop), so it never suggests something someone else already grabbed.
    const pickForMe = (count: number) => {
        if (isReadOnly) return;
        const available = liveSeats.filter(s => s.status === "AVAILABLE");
        if (available.length === 0) {
            toast.error("No seats are available right now");
            return;
        }
        const n = Math.min(count, available.length, MAX_SEATS);
        const shuffled = [...available].sort(() => Math.random() - 0.5);
        setSelectedIds(shuffled.slice(0, n).map(s => s.publicId));
    }

    const rzpOpened = useRef(false);

    useEffect(() => {
        if (state?.success && state?.order && state?.razorpayKey && !rzpOpened.current) {
            rzpOpened.current = true;
            setReservationExpired(false);

            const loadRazorpayScript = () => {
                return new Promise((resolve) => {
                    if (typeof window !== "undefined" && (window as any).Razorpay) {
                        resolve(true);
                        return;
                    }
                    const script = document.createElement("script");
                    script.src = "https://checkout.razorpay.com/v1/checkout.js";
                    script.onload = () => resolve(true);
                    script.onerror = () => resolve(false);
                    document.body.appendChild(script);
                });
            };

            const initPayment = async () => {
                const res = await loadRazorpayScript();
                if (!res) {
                    toast.error("Razorpay failed to load. Are you online?");
                    rzpOpened.current = false;
                    return;
                }

                const bookedSeatNames = liveSeats.filter(s => selectedIds.includes(s.publicId)).map(s => s.name);

                try {
                    const options = {
                        key: state.razorpayKey,
                        amount: state.order.amount,
                        currency: state.order.currency || "INR",
                        name: "Lottery Pool Booking",
                        description: `Booking for ${selectedIds.length} seats`,
                        order_id: state.order.id, // This is the order ID created in the backend
                        handler: async function (response: any) {
                            setIsVerifying(true);
                            try {
                                const verifyResult = await verifyPaymentAction({
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_signature: response.razorpay_signature
                                });

                                if (verifyResult?.error) {
                                    toast.error("We couldn't confirm this payment: " + verifyResult.error);
                                    setIsVerifying(false);
                                } else {
                                    setConfirmed({
                                        seatNames: bookedSeatNames,
                                        amount: Number(state.order.amount) / 100
                                    });
                                }
                            } catch (err: any) {
                                console.error("Verification Error:", err);
                                toast.error("Failed to process payment verification.");
                                setIsVerifying(false);
                            }

                        },
                        prefill: {
                            name: user?.name || "",
                            email: "",
                            contact: user?.phone || ""
                        },
                        theme: {
                            color: "#9333ea" // matches bg-purple-600
                        },
                        modal: {
                            ondismiss: async function () {
                                await paymentDismissAction(state.order.id);
                                toast("No worries — your seats have been released. Pick them again whenever you're ready.");
                                rzpOpened.current = false;
                                sessionStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify(selectedIds));
                                window.location.reload();
                            }
                        }

                    };

                    const rzp = new (window as any).Razorpay(options);
                    rzp.on('payment.failed', async function (response: any) {
                        await paymentFailureAction({
                            razorpay_payment_id: response.error.metadata?.payment_id || "",
                            razorpay_order_id: response.error.metadata?.order_id || state.order.id,
                            reason: response.error.reason,
                            code: response.error.code,
                        });
                        toast.error("That payment didn't go through: " + response.error.description + ". Your seats are still held — you can try again.");
                    });
                    rzp.open();

                } catch (err: any) {
                    console.error("Razorpay Error:", err);
                    toast.error("Could not start payment: " + err.message);
                }
            };

            initPayment();
        }
    }, [state, router, selectedIds.length]);

    const totalAmount = selectedIds.length * perSeatPrice;

    // A dedicated confirmation moment instead of a toast-and-redirect — the
    // player just paid real money and deserves to see what they got.
    if (confirmed) {
        return (
            <div className="max-w-lg mx-auto text-center py-16 px-6">
                <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
                </div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">You're in</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    {poolName ? `${poolName}` : "Your booking"}{roundNumber ? ` · Round ${roundNumber}` : ""}
                </p>

                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-left space-y-4 mb-8">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Seats booked</span>
                        <span className="font-medium text-gray-900 dark:text-white">{confirmed.seatNames.join(", ")}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Amount paid</span>
                        <span className="font-semibold text-gray-900 dark:text-white">₹{confirmed.amount.toLocaleString("en-IN")}</span>
                    </div>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                    We'll draw this round automatically once it closes — no need to do anything else. You'll see the result here and in your wallet.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/dashboard"
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                        Go to dashboard <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/games"
                        className="px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                        <Ticket className="w-4 h-4" /> Browse more pools
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            {state?.error && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-center font-medium border border-red-200 dark:border-red-800">
                    {state.error}
                </div>
            )}

            {!isReadOnly && (
                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start px-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">Not fussed which seat?</span>
                    {[1, 2, 4].map(n => (
                        <button
                            key={n}
                            type="button"
                            onClick={() => pickForMe(n)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-full border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                        >
                            Pick {n} for me
                        </button>
                    ))}
                </div>
            )}

            <div className="p-6 sm:p-10 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
                <SeatMap
                    seats={liveSeats}
                    selectedSeatIds={selectedIds}
                    onSeatSelect={toggleSeat}
                />
            </div>

            {/* Summary Bar - Bottom Sticky */}
            {selectedIds.length > 0 && (
                <form action={formAction} className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40 animate-in slide-in-from-bottom flex justify-center">
                    <input type="hidden" name="roundId" value={roundId} />
                    <input type="hidden" name="seats" value={JSON.stringify(selectedIds)} />
                    <input type="hidden" name="amount" value={totalAmount} />

                    <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-4xl gap-4">
                        <div className="flex flex-col gap-1 text-center sm:text-left">
                            {state?.success && state?.tokenExpiresAt && !reservationExpired && (
                                <div className="mb-1">
                                    <ReservationCountdown
                                        expiresAt={state.tokenExpiresAt}
                                        onExpire={() => setReservationExpired(true)}
                                    />
                                </div>
                            )}
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {selectedIds.length} seat{selectedIds.length > 1 ? 's' : ''} • Total: <span className="font-semibold text-gray-900 dark:text-white">₹{totalAmount}</span>
                            </p>
                            <p className="font-semibold text-gray-900 dark:text-white max-w-50 sm:max-w-md truncate" title={liveSeats.filter(s => selectedIds.includes(s.publicId)).map(s => s.name).join(', ')}>
                                {liveSeats.filter(s => selectedIds.includes(s.publicId)).map(s => s.name).join(', ')}
                            </p>
                        </div>


                        {isLoggedIn ? (
                            <button
                                type="submit"
                                disabled={isPending || isVerifying || reservationExpired}
                                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-xl shadow-lg shadow-purple-600/20 transition-all active:scale-95 w-full sm:w-auto flex items-center justify-center min-w-40"
                            >
                                {isVerifying ? "Confirming payment…" : (isPending ? "Reserving your seats…" : reservationExpired ? "Reservation ended — reselect" : "Proceed to Book")}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
                                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl shadow-lg shadow-purple-600/20 transition-all active:scale-95 w-full sm:w-auto"
                            >
                                Log in to Book
                            </button>
                        )}
                    </div>
                </form>
            )}
        </div>
    )
}
