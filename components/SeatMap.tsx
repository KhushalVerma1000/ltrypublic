"use client"

export type SeatStatus = "AVAILABLE" | "RESERVED" | "SOLD"

export interface Seat {
    name: string
    status: SeatStatus
    publicId: string
}

interface SeatMapProps {
    seats: Seat[]
    onSeatSelect?: (seat: Seat) => void
    selectedSeatIds?: string[]
}

export default function SeatMap({ seats, onSeatSelect, selectedSeatIds = [] }: SeatMapProps) {
    // Group seats by series (A, B, C, D) using the first character
    const groupedSeats = seats.reduce((acc, seat) => {
        const series = seat.name.charAt(0).toUpperCase()
        if (!acc[series]) acc[series] = []
        acc[series].push(seat)
        return acc
    }, {} as Record<string, Seat[]>)

    const seriesKeys = Object.keys(groupedSeats).sort()

    const getSeatColor = (seat: Seat) => {
        const isSelected = selectedSeatIds.includes(seat.publicId)

        if (isSelected) {
            return "bg-purple-600 text-white border-2 border-purple-700 shadow-md ring-2 ring-purple-600 ring-offset-1 dark:ring-offset-gray-950"
        }

        switch (seat.status) {
            case "AVAILABLE":
                return "bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-purple-500 hover:text-purple-600 transition-colors"
            case "RESERVED":
                return "bg-amber-500 text-white border-2 border-amber-600 shadow-sm opacity-80"
            case "SOLD":
            default:
                return "bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-600 border-2 border-gray-200 dark:border-gray-800 cursor-not-allowed opacity-60"
        }
    }

    return (
        <div className="w-full">
            {/* Screen indicator imitating a cinema */}
            <div className="mb-12 flex flex-col items-center">
                <p className="text-xs font-semibold tracking-[0.3em] text-gray-400 dark:text-gray-500 mt-4 uppercase">Draw Stage</p>
            </div>

            <div className="flex flex-col gap-6 w-full items-center">
                {seriesKeys.map(series => (
                    <div key={series} className="flex gap-4 sm:gap-6 items-start sm:items-center w-full max-w-4xl pb-2 justify-center">
                        <div className="w-6 sm:w-8 font-bold text-lg sm:text-xl text-gray-400 dark:text-gray-600 shrink-0 mt-1 sm:mt-0">
                            {series}
                        </div>
                        <div className="flex gap-2 sm:gap-3 flex-wrap justify-center flex-1">
                            {groupedSeats[series]
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map(seat => (
                                    <button
                                        key={seat.publicId}
                                        type="button"
                                        onClick={() => onSeatSelect?.(seat)}
                                        disabled={seat.status !== "AVAILABLE"}
                                        className={[
                                            "w-9 h-9 sm:w-11 sm:h-11 rounded-t-xl rounded-b sm:rounded-t-2xl sm:rounded-b-md flex items-center justify-center text-[10px] sm:text-xs font-semibold shrink-0 transition-colors",
                                            seat.status === "AVAILABLE" ? "cursor-pointer" : "cursor-not-allowed",
                                            getSeatColor(seat)
                                        ].join(" ")}
                                        title={seat.name}
                                    >
                                        <span className="mt-1">{seat.name.substring(1)}</span>
                                    </button>
                                ))}
                        </div>
                        <div className="w-6 sm:w-8 shrink-0 text-right font-bold text-lg sm:text-xl text-gray-400 dark:text-gray-600 mt-1 sm:mt-0">
                            {series}
                        </div>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-8 px-6 py-4 border border-gray-100 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900/50 max-w-fit mx-auto shadow-sm">
                <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-sm border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Available</span>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-sm border-2 border-purple-700 bg-purple-600" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Selected</span>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-sm border-2 border-amber-600 bg-amber-500 opacity-80" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Reserved</span>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-sm border-2 border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 opacity-60" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sold</span>
                </div>
            </div>
        </div>
    )
}
