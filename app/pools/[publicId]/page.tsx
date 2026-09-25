import { cookies } from "next/headers"
import Link from "next/link"
import Navbar from "@/components/Navbar"
import SeatMapClient from "./seat-map-client"
import RoundWinners from "@/components/RoundWinners"
import { DrawingTimer } from "@/components/DrawingTimer"
import { Calendar, Info, Trophy, CheckCircle2, Clock, AlertCircle } from "lucide-react"

interface Seat {
    name: string
    status: "AVAILABLE" | "RESERVED" | "SOLD"
    publicId: string
}

async function  getSeats(roundId: string): Promise<Seat[]> {
    try {
        const res = await fetch(`${process.env.API_URL}/seats/round/${roundId}`, {
            cache: 'no-store',
            next: { revalidate: 0 } // Always fetch fresh to avoid stale seating
        })
        if (!res.ok) return []

        const data = await res.json()
        if (data.success && Array.isArray(data.data)) {
            return data.data
        }
        return []
    } catch (e) {
        console.error("Error fetching seats:", e)
        return []
    }
}

async function getWinners(poolId: string, roundId: string): Promise<any[]> {
    try {
        const res = await fetch(`${process.env.API_URL}/winners/${poolId}/round/${roundId}`, {
            next: { revalidate: 60 }
        })
        if (!res.ok) return []
        const data = await res.json()
        return data.success ? data.data : []
    } catch (e) {
        console.error("Error fetching winners:", e)
        return []
    }
}

async function getPoolInfo(publicId: string): Promise<any | null> {
    try {
        const [poolRes, roundsRes] = await Promise.all([
            fetch(`${process.env.API_URL}/pools/p/${publicId}`, { cache: 'no-store', next: { revalidate: 0 } }),
            fetch(`${process.env.API_URL}/pools/${publicId}/rounds`, { cache: 'no-store', next: { revalidate: 0 } })
        ])

        if (!poolRes.ok) return null
        const poolData = await poolRes.json()
        if (!poolData.success) return null

        const roundsData = roundsRes.ok ? await roundsRes.json() : { success: false, data: [] }
        const rounds = roundsData.success ? roundsData.data : []

        return {
            ...poolData.data,
            rounds: rounds
        }
    } catch (e) {
        console.error("Error fetching pool info:", e)
        return null
    }
}

export default async function PoolSeatsPage(props: {
    params: Promise<{ publicId: string }>,
    searchParams: Promise<{ roundId?: string }>
}) {
    const params = await props.params
    const searchParams = await props.searchParams
    const poolInfo = await getPoolInfo(params.publicId)

    if (!poolInfo) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col pt-16">
                <Navbar isLoggedIn={false} />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-500">Pool not found.</p>
                </div>
            </div>
        )
    }

    const rounds = poolInfo.rounds || []
    const activeRound = rounds.find((r: any) => r.status === "DRAWING") || rounds.find((r: any) => r.status === "UPCOMING") || rounds.find((r: any) => r.status === "ACTIVE")
    const selectedRound = searchParams.roundId
        ? rounds.find((r: any) => r.publicId === searchParams.roundId)
        : activeRound || rounds[0]

    const [seats, winners] = await Promise.all([
        selectedRound ? getSeats(selectedRound.publicId) : Promise.resolve([]),
        (selectedRound && selectedRound.status === "CLOSED") ? getWinners(params.publicId, selectedRound.publicId) : Promise.resolve([])
    ])

    const cookieStore = await cookies()
    const isLoggedIn = !!cookieStore.get("accessToken")
    const perSeatPrice = selectedRound?.priceSnapshot ? parseFloat(selectedRound.priceSnapshot) : (parseFloat(poolInfo?.perSeatPrice) || 0)

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col pt-16">
            <Navbar isLoggedIn={isLoggedIn} />

            {/* Header Section */}
            <section className="pt-12 pb-8 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="text-left">
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                {poolInfo.name}
                            </h1>
                            {poolInfo.notes && (
                                <p className="text-sm text-gray-400 dark:text-gray-500 italic mb-3">{poolInfo.notes}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1.5">
                                    <Info className="w-4 h-4" />
                                    ₹{perSeatPrice} per seat
                                </span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    {rounds.length} Rounds Total
                                </span>
                                {selectedRound && (
                                    <>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                        <span className="flex items-center gap-1.5 font-semibold text-purple-600 dark:text-purple-400">
                                            <Trophy className="w-4 h-4" />
                                            Prize Pool: ₹{(perSeatPrice * (selectedRound.availableSeats ?? 0)).toLocaleString('en-IN')}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Round Switcher */}
                        <div className="flex flex-wrap gap-2">
                            {rounds.map((round: any) => {
                                const isActive = selectedRound?.publicId === round.publicId
                                const statusColor = round.status === "DRAWING"
                                    ? "bg-red-500 text-white"
                                    : round.status === "UPCOMING"
                                    ? "bg-amber-500 text-white"
                                    : round.status === "CLOSED"
                                    ? "bg-gray-500 text-white"
                                    : "bg-emerald-500 text-white"
                                return (
                                    <Link
                                        key={round.publicId}
                                        href={`/pools/${params.publicId}?roundId=${round.publicId}`}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${isActive
                                                ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-200 dark:shadow-none"
                                                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-purple-300"
                                            }`}
                                    >
                                        Round {round.roundNumber}
                                        <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[8px] uppercase ${statusColor}`}>
                                            {round.status}
                                        </span>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    {!selectedRound ? (
                        <div className="text-center py-20 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl">
                            <p className="text-gray-500 dark:text-gray-400">No rounds available for this pool.</p>
                        </div>
                    ) : selectedRound.status === "CLOSED" ? (
                        <div className="space-y-12">
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
                                <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg">
                                    <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
                                </div>
                                <div>
                                    <h3 className="text-amber-900 dark:text-amber-400 font-bold text-lg">This Round is Closed</h3>
                                    <p className="text-amber-800/80 dark:text-amber-500/80 text-sm">
                                        Seat booking is no longer available for this round. You can view the winners and results below.
                                    </p>
                                </div>
                            </div>

                            {/* Winners Section */}
                            <RoundWinners winners={winners} />

                            <div className="space-y-6 pt-12 border-t border-gray-100 dark:border-gray-800">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <div className="w-2 h-8 bg-gray-400 rounded-full" />
                                    Round {selectedRound.roundNumber} Result Map
                                </h2>
                                <div className="opacity-75 pointer-events-none">
                                    <SeatMapClient
                                        seats={seats}
                                        perSeatPrice={perSeatPrice}
                                        isLoggedIn={isLoggedIn}
                                        roundId={selectedRound.publicId}
                                        isReadOnly={true}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <div className="w-2 h-8 bg-purple-600 rounded-full" />
                                    Round {selectedRound.roundNumber} Seating
                                </h2>
                                <div className="text-sm text-gray-500">
                                    Ends {new Date(selectedRound.endsAt).toLocaleDateString()}
                                </div>
                            </div>
                            
                            {selectedRound.status === "DRAWING" && selectedRound.drawnAt && (
                                <DrawingTimer drawnAt={selectedRound.drawnAt} />
                            )}

                            {seats.length === 0 ? (
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-xl p-6 text-center">
                                    <p className="text-amber-900 dark:text-amber-400 font-medium">Seats are not available for this round yet.</p>
                                </div>
                            ) : (
                                <SeatMapClient
                                    seats={seats}
                                    perSeatPrice={perSeatPrice}
                                    isLoggedIn={isLoggedIn}
                                    roundId={selectedRound.publicId}
                                    isReadOnly={selectedRound.status === "DRAWING"}
                                />
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
