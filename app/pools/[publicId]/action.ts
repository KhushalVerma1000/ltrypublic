"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export const bookSeatsAction = async (
    _prevState: { error?: string, success?: boolean, order?: any, razorpayKey?: string, tokenExpiresAt?: string } | undefined,
    formData: FormData
) => {
    const amountStr = formData.get("amount")?.valueOf()
    const seatsStr = formData.get("seats")?.valueOf()
    const roundId = formData.get("roundId")?.valueOf()

    if (typeof amountStr !== "string" || typeof seatsStr !== "string" || typeof roundId !== "string") {
        return { error: "Invalid booking data" }
    }

    const cookieStore = await cookies()
    let accessToken = cookieStore.get("accessToken")?.value
    const refreshToken = cookieStore.get("refreshToken")?.value

    if (!accessToken && !refreshToken) {
        return { error: "You must be logged in to book seats." }
    }

    // Helper: attempt a booking call with the given token
    const attemptBooking = async (token: string | undefined) => {
        return fetch(process.env.API_URL + "/bookings/bookSeats", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": `accessToken=${token || ''}; refreshToken=${refreshToken || ''}`
            },
            body: JSON.stringify({
                amount: Number(amountStr),  // Always send as number, not string
                seats: seatsStr,
                roundId: roundId
            })
        })
    }

    try {
        let response = await attemptBooking(accessToken)

        // If 401, try to silently refresh the token and retry once
        if (response.status === 401 && refreshToken) {
            try {
                const API_URL = process.env.API_URL ?? 'http://localhost:8000/api/v1'
                const refreshRes = await fetch(`${API_URL}/users/refresh-token`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Cookie": `refreshToken=${refreshToken}`
                    },
                    body: JSON.stringify({ refreshToken }),
                    cache: "no-store"
                })

                if (refreshRes.ok) {
                    const refreshData = await refreshRes.json()
                    const newAccessToken = refreshData?.data?.accessToken
                    const newRefreshToken = refreshData?.data?.refreshToken
                    if (newAccessToken) {
                        accessToken = newAccessToken
                        const cs = await cookies()
                        cs.set("accessToken", newAccessToken, { maxAge: 60 * 60 * 24, path: '/', httpOnly: true, sameSite: 'lax' })
                        // IMPORTANT: also persist the rotated refreshToken so the
                        // next request doesn't use the now-invalidated old one.
                        if (newRefreshToken) {
                            cs.set("refreshToken", newRefreshToken, { maxAge: 60 * 60 * 24 * 7, path: '/', httpOnly: true, sameSite: 'lax' })
                        }
                        // Retry the booking with the fresh token
                        response = await attemptBooking(newAccessToken)
                    }
                }
            } catch {
                // Refresh failed — fall through to error handling below
            }
        }

        const data = await response.json()

        if (!response.ok || !data.success) {
            return { error: data?.message ?? "Booking failed. Please try again." }
        }

        return {
            success: true,
            order: data.data.order,
            razorpayKey: process.env.RAZORPAY_KEY_ID,
            tokenExpiresAt: data.data.booking?.tokenExpiresAt
        };

    } catch (e) {
        return { error: "Unable to connect to booking server." }
    }
}


export const verifyPaymentAction = async (paymentData: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}) => {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    const refreshToken = cookieStore.get("refreshToken")?.value

    if (!accessToken && !refreshToken) {
        return { error: "You must be logged in to verify payment." }
    }

    try {
        const response = await fetch(process.env.API_URL + "/bookings/verifyPayment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": `accessToken=${accessToken || ''}; refreshToken=${refreshToken || ''}`
            },
            body: JSON.stringify(paymentData)
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
            return { error: data?.message ?? "Payment verification failed. Please contact support." }
        }

        return { success: true }

    } catch (e) {
        return { error: "Unable to connect to verification server." }
    }
}

export const paymentFailureAction = async (data: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    reason?: string;
    code?: string;
}) => {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    const refreshToken = cookieStore.get("refreshToken")?.value

    try {
        await fetch(process.env.API_URL + "/bookings/paymentFailure", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": `accessToken=${accessToken || ''}; refreshToken=${refreshToken || ''}`
            },
            body: JSON.stringify(data)
        })
    } catch (e) {
        console.error("paymentFailureAction error:", e)
    }
}

export const paymentDismissAction = async (razorpay_order_id: string) => {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    const refreshToken = cookieStore.get("refreshToken")?.value

    try {
        await fetch(process.env.API_URL + "/bookings/paymentDismiss", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": `accessToken=${accessToken || ''}; refreshToken=${refreshToken || ''}`
            },
            body: JSON.stringify({ razorpay_order_id })
        })
    } catch (e) {
        console.error("paymentDismissAction error:", e)
    }
}
