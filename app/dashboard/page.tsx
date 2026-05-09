import { cookies } from "next/headers"
import Link from "next/link"
import { logoutAction } from "./action"
import BookingHistory from "@/components/BookingHistory"
import UserWinnings from "@/components/UserWinnings"

interface User {
  id: number
  publicId: string
  name: string
  phone: string
  bankAccountNumber: string | null
  bankIFSCCode: string | null
  upiId: string | null
  createdAt: string
  updatedAt: string
}

async function getBookings(page = 1, limit = 10) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("accessToken")?.value
  const refreshToken = cookieStore.get("refreshToken")?.value

  if (!accessToken && !refreshToken) return { data: [], pagination: {} }

  try {
    const res = await fetch(`${process.env.API_URL}/users/current-bookings?page=${page}&limit=${limit}`, {
      headers: {
        "Cookie": `accessToken=${accessToken || ''}; refreshToken=${refreshToken || ''}`
      },
      next: { revalidate: 0 }
    })

    if (!res.ok) return { data: [], pagination: {} }
    const data = await res.json()
    return data.success ? data.data : { data: [], pagination: {} }
  } catch (e) {
    console.error("Error fetching bookings:", e)
    return { data: [], pagination: {} }
  }
}

async function getWinnings() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("accessToken")?.value
  const refreshToken = cookieStore.get("refreshToken")?.value

  if (!accessToken && !refreshToken) return []

  try {
    const res = await fetch(`${process.env.API_URL}/users/winnings`, {
      headers: {
        "Cookie": `accessToken=${accessToken || ''}; refreshToken=${refreshToken || ''}`
      },
      next: { revalidate: 0 }
    })

    if (!res.ok) return []
    const data = await res.json()
    return data.success ? data.data : []
  } catch (e) {
    console.error("Error fetching winnings:", e)
    return []
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1
  
  const cookieStore = await cookies()
  const rawUser = cookieStore.get("user")?.value
  const { data: bookings, pagination } = await getBookings(page, 10)
  const winnings = await getWinnings()

  let user: User | null = null
  if (rawUser) {
    try {
      user = JSON.parse(rawUser) as User
    } catch {
      // cookie parse failed
    }
  }

  // Calculate stats
  const completedBookings = bookings.filter((b: any) => b.status === "COMPLETED")
  const activeTicketsCount = completedBookings.reduce((acc: number, b: any) => acc + (b.bookedSeats?.length || 0), 0)
  const totalWinningsAmount = winnings.reduce((acc: number, w: any) => acc + parseFloat(w.prize), 0)
  const totalDraws = pagination?.total ?? 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top Bar */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-purple-600 to-purple-800 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">HL</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white hidden sm:inline">
              Haryana Lottery
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs font-semibold text-gray-900 dark:text-white">
                {user?.name ?? "Player"}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {user?.phone}
              </span>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Profile & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Welcome Banner */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 text-xl font-bold">
                  {user?.name?.[0] ?? "P"}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-purple-600 dark:text-purple-400">
                    User Profile
                  </p>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {user?.name ?? "Player"}
                  </h1>
                </div>
              </div>
              <div className="space-y-2 pt-4 border-t border-gray-50 dark:border-gray-800">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Phone</span>
                  <span className="text-gray-900 dark:text-gray-300">{user?.phone ?? "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Member since</span>
                  <span className="text-gray-900 dark:text-gray-300">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                  </span>
                </div>
              </div>
              
              <div className="pt-6 mt-6 border-t border-gray-50 dark:border-gray-800">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
                  Payout Information
                </p>
                <div className="space-y-3">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 mb-0.5 uppercase">Bank Account</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white font-mono">{user?.bankAccountNumber ?? "Not set"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                      <p className="text-[10px] text-gray-500 mb-0.5 uppercase">IFSC</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white uppercase">{user?.bankIFSCCode ?? "—"}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                      <p className="text-[10px] text-gray-500 mb-0.5 uppercase">UPI ID</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.upiId ?? "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4">
              {[
                { label: "Active tickets", value: activeTicketsCount, color: "text-purple-600" },
                { label: "Total winnings", value: `₹${totalWinningsAmount.toLocaleString()}`, color: "text-emerald-600" },
                { label: "Total Entries", value: totalDraws, color: "text-blue-600" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm"
                >
                  <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Quick Links */}
            <div className="bg-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-purple-200 dark:shadow-none overflow-hidden relative">
              <div className="relative z-10">
                <h3 className="text-lg font-bold mb-2">Ready for the next draw?</h3>
                <p className="text-purple-100 text-sm mb-4">
                  Explore our latest pools and book your lucky seats today.
                </p>
                <Link
                  href="/games"
                  className="inline-flex items-center justify-center px-4 py-2 bg-white text-purple-600 rounded-lg text-sm font-bold hover:bg-purple-50 transition-colors"
                >
                  View All Games
                </Link>
              </div>
              {/* Decorative element */}
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500 rounded-full opacity-50 blur-2xl" />
            </div>
          </div>

          {/* Right Column: Activities */}
          <div className="lg:col-span-2 space-y-8">
            <UserWinnings winnings={winnings} />
            <BookingHistory bookings={bookings} pagination={pagination} />
          </div>
        </div>
      </main>
    </div>
  )
}

