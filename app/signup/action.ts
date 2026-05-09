"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const setCookie = async (name: string, value: string, maxAge: number) => {
    const cookieStore = await cookies()
    cookieStore.set(name, value, {
        maxAge,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/"
    })
}

export const signupAction = async (
    _prevState: { error?: string } | undefined,
    formData: FormData
) => {
    const name = formData.get("name")?.valueOf()
    const phone = formData.get("phone")?.valueOf()
    const password = formData.get("password")?.valueOf()
    const bankAccountNumber = formData.get("bankAccountNumber")?.valueOf()
    const bankIFSCCode = formData.get("bankIFSCCode")?.valueOf()
    const upiId = formData.get("upiId")?.valueOf()

    if (
        typeof name !== "string" || 
        typeof phone !== "string" || 
        typeof password !== "string" ||
        typeof bankAccountNumber !== "string" ||
        typeof bankIFSCCode !== "string" ||
        typeof upiId !== "string"
    ) {
        return { error: "Invalid form data" }
    }

    // Basic SQL injection guard
    const sqlInjectionPattern = /(\b(SELECT|INSERT|DELETE|UPDATE|DROP|ALTER|CREATE|TRUNCATE|EXEC|UNION|OR|AND)\b|\-\-|\;|\')/i
    if (
        sqlInjectionPattern.test(name) ||
        sqlInjectionPattern.test(phone) ||
        sqlInjectionPattern.test(password) ||
        sqlInjectionPattern.test(bankAccountNumber) ||
        sqlInjectionPattern.test(bankIFSCCode) ||
        sqlInjectionPattern.test(upiId)
    ) {
        return { error: "Invalid input data" }
    }

    let data
    try {
        const response = await fetch(process.env.API_URL + "/users/register", {
            method: "POST",
            body: JSON.stringify({ 
                name, 
                phone, 
                password,
                bankAccountNumber,
                bankIFSCCode,
                upiId
            }),
            headers: { "Content-Type": "application/json" }
        })

        data = await response.json()

        if (!response.ok || !data.success) {
            return { error: data?.message ?? "Registration failed. Try again." }
        }
    } catch {
        return { error: "Unable to reach the server. Please try again." }
    }

    if (!data.data?.accessToken) {
        return { error: "Invalid response from server" }
    }

    await setCookie("accessToken", data.data.accessToken, 60 * 15)           // 15 min
    await setCookie("refreshToken", data.data.refreshToken, 60 * 60 * 24 * 7) // 7 days
    await setCookie("user", JSON.stringify(data.data.user), 60 * 60 * 24 * 7)

    const redirectTo = formData.get("redirectTo")?.valueOf()
    const finalRedirect = typeof redirectTo === "string" && redirectTo.startsWith("/") ? redirectTo : "/dashboard"

    redirect(finalRedirect)
}
