import { cookies } from "next/headers"
import Link from "next/link"
import PrivateShell from "@/components/PrivateShell"
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
    <PrivateShell
      title={`Hi, ${user?.name?.trim().split(" ")[0] ?? "Player"}`}
      subtitle="Your tickets, winnings and payout details in one place."
    >
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column: Profile & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Welcome Banner */}
            <div className="bg-white dark:bg-gray-900 border border-brand-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center text-brand-600 dark:text-brand-400 text-xl font-bold">
                  {user?.name?.[0] ?? "P"}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
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
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-3 lg:gap-4">
              {[
                { label: "Active tickets", value: activeTicketsCount, color: "text-brand-600" },
                { label: "Total winnings", value: `₹${totalWinningsAmount.toLocaleString()}`, color: "text-brand-700" },
                { label: "Total Entries", value: totalDraws, color: "text-brand-600" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white dark:bg-gray-900 border border-brand-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm"
                >
                  <p className="text-[10px] sm:text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-xl sm:text-3xl font-bold ${stat.color} truncate`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Quick Links */}
            <div className="bg-brand-600 rounded-2xl p-6 text-white shadow-lg shadow-brand-200 dark:shadow-none overflow-hidden relative">
              <div className="relative z-10">
                <h3 className="text-lg font-bold mb-2">Ready for the next draw?</h3>
                <p className="text-brand-100 text-sm mb-4">
                  Explore our latest pools and book your lucky seats today.
                </p>
                <Link
                  href="/games"
                  className="inline-flex items-center justify-center px-4 py-2 bg-white text-brand-600 rounded-lg text-sm font-bold hover:bg-brand-50 transition-colors"
                >
                  View All Games
                </Link>
              </div>
              {/* Decorative element */}
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-brand-500 rounded-full opacity-50 blur-2xl" />
            </div>
          </div>

          {/* Right Column: Activities */}
          <div className="lg:col-span-2 space-y-8">
            <UserWinnings winnings={winnings} />
            <BookingHistory bookings={bookings} pagination={pagination} />
          </div>
        </div>
    </PrivateShell>
  )
}

