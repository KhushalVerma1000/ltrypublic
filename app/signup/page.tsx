"use client"

import { useActionState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { signupAction } from "./action"

function SignupForm() {
  const [state, formAction, isPending] = useActionState(signupAction, undefined)
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get("redirect")

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-base">HL</span>
          </div>
          <span className="text-xl font-semibold text-gray-900 dark:text-white">
            Haryana Lottery
          </span>
        </div>

        {/* Card */}
        <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-8 bg-white dark:bg-gray-900">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            Create an account
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Start playing and win big today
          </p>

          {state?.error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            {redirectPath && (
                <input type="hidden" name="redirectTo" value={redirectPath} />
            )}

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="Saurav"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Phone number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                required
                placeholder="9999999999"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            {/* Bank Details Header */}
            <div className="pt-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Payout Information
              </p>
            </div>

            {/* Bank Account Number */}
            <div>
              <label
                htmlFor="bankAccountNumber"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Bank Account Number
              </label>
              <input
                id="bankAccountNumber"
                name="bankAccountNumber"
                type="text"
                required
                placeholder="000000000000"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* IFSC Code */}
              <div>
                <label
                  htmlFor="bankIFSCCode"
                  className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  IFSC Code
                </label>
                <input
                  id="bankIFSCCode"
                  name="bankIFSCCode"
                  type="text"
                  required
                  placeholder="SBIN0000123"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition uppercase"
                />
              </div>

              {/* UPI ID */}
              <div>
                <label
                  htmlFor="upiId"
                  className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  UPI ID
                </label>
                <input
                  id="upiId"
                  name="upiId"
                  type="text"
                  required
                  placeholder="name@upi"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors mt-2"
            >
              {isPending ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-5">
            Already have an account?{" "}
            <Link
              href={redirectPath ? `/login?redirect=${encodeURIComponent(redirectPath)}` : "/login"}
              className="text-purple-600 dark:text-purple-400 font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-4">Loading...</div>}>
      <SignupForm />
    </Suspense>
  )
}
