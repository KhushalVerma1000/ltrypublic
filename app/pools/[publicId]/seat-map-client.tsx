"use client"

import { useState, useActionState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import SeatMap, { Seat } from "@/components/SeatMap"
import { bookSeatsAction, verifyPaymentAction, paymentFailureAction, paymentDismissAction } from "./action"
import { useUser } from "@/app/context/UserContext"
import { toast } from "sonner"

export default function SeatMapClient({
    seats,
    roundId,
    perSeatPrice,
    isLoggedIn,
    isReadOnly = false
}: {
    seats: Seat[],
    roundId: string,
    perSeatPrice: number,
    isLoggedIn: boolean,
    isReadOnly?: boolean
}) {
    const router = useRouter();
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isVerifying, setIsVerifying] = useState(false)
    const [state, formAction, isPending] = useActionState(bookSeatsAction, undefined)
    const user = useUser()

    const toggleSeat = (seat: Seat) => {
        if (isReadOnly) return;
        setSelectedIds(prev => {
            if (prev.includes(seat.publicId)) {
                return prev.filter(id => id !== seat.publicId)
            } else {
                if (prev.length >= 4) {
                    toast.error("Only four seats can be bought at once")
                    return prev
                }
                return [...prev, seat.publicId]
            }
        })
    }

    const rzpOpened = useRef(false);

    useEffect(() => {
        if (state?.success && state?.order && state?.razorpayKey && !rzpOpened.current) {
            rzpOpened.current = true;

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
                                    toast.error("Payment Verification Failed: " + verifyResult.error);
                                    setIsVerifying(false);
                                } else {
                                    toast.success("Payment Successful!");
                                    window.location.href = '/dashboard';
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
                                toast.error("Payment was dismissed. Your booking has been cancelled.");
                                rzpOpened.current = false;
                                window.location.reload();
                            }
                        }

                    };

                    const rzp = new (window as any).Razorpay(options);
                    rzp.on('payment.failed', async function (response: any) {
                        // console.error(response.error);
                        await paymentFailureAction({
                            razorpay_payment_id: response.error.metadata?.payment_id || "",
                            razorpay_order_id: response.error.metadata?.order_id || state.order.id,
                            reason: response.error.reason,
                            code: response.error.code,
                        });
                        toast.error("Payment Failed: " + response.error.description);
                        // setTimeout(() => {
                        //     window.location.reload();
                        // }, 2000);
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

    return (
        <div className="flex flex-col gap-8">
            {state?.error && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-center font-medium border border-red-200 dark:border-red-800">
                    {state.error}
                </div>
            )}

            <div className="p-6 sm:p-10 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
                <SeatMap
                    seats={seats}
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
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {selectedIds.length} seat{selectedIds.length > 1 ? 's' : ''} • Total: <span className="font-semibold text-gray-900 dark:text-white">₹{totalAmount}</span>
                            </p>
                            <p className="font-semibold text-gray-900 dark:text-white max-w-50 sm:max-w-md truncate" title={seats.filter(s => selectedIds.includes(s.publicId)).map(s => s.name).join(', ')}>
                                {seats.filter(s => selectedIds.includes(s.publicId)).map(s => s.name).join(', ')}
                            </p>
                        </div>


                        {isLoggedIn ? (
                            <button
                                type="submit"
                                disabled={isPending || isVerifying}
                                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-xl shadow-lg shadow-purple-600/20 transition-all active:scale-95 w-full sm:w-auto flex items-center justify-center min-w-40"
                            >
                                {isVerifying ? "Verifying..." : (isPending ? "Booking..." : "Proceed to Book")}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => router.push(`/login?redirect=${window.location.pathname}`)}
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
