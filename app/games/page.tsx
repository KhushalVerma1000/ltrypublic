import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { DrawingTimer } from "@/components/DrawingTimer";
import { ArrowRight, Ticket, Users, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

interface Pool {
    publicId: string;
    name: string;
    perSeatPrice: string;
    totalSeats: number;
    activeRound: {
        publicId: string;
        status: string;
        startsAt: string;
        endsAt: string;
        drawnAt: string | null;
        availableSeats: number;
    } | null;
}

async function getPools(): Promise<Pool[]> {
    try {
        const res = await fetch(`${process.env.API_URL}/pools`, {
            cache: 'no-store',
            next: { revalidate: 0 }
        });
        if (!res.ok) return [];
        
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
            return data.data.filter((pool: Pool) => pool.activeRound !== null);
        }
        return [];
    } catch (e) {
        console.error("Error fetching pools:", e);
        return [];
    }
}

export default async function GamesPage() {
    const pools = await getPools();
    const cookieStore = await cookies();
    const isLoggedIn = !!cookieStore.get("accessToken");

    const styling = [
        { 
            gradient: "from-indigo-600 via-indigo-700 to-violet-800", 
            accent: "bg-indigo-400/20",
            shadow: "shadow-indigo-500/20",
            border: "border-indigo-400/30"
        },
        { 
            gradient: "from-amber-500 via-orange-500 to-yellow-600", 
            accent: "bg-amber-400/20",
            shadow: "shadow-amber-500/20",
            border: "border-amber-400/30"
        },
        { 
            gradient: "from-rose-500 via-pink-500 to-rose-600", 
            accent: "bg-rose-400/20",
            shadow: "shadow-rose-500/20",
            border: "border-rose-400/30"
        },
        { 
            gradient: "from-emerald-500 via-teal-500 to-cyan-600", 
            accent: "bg-emerald-400/20",
            shadow: "shadow-emerald-500/20",
            border: "border-emerald-400/30"
        }
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Navbar isLoggedIn={isLoggedIn} />

            {/* Hero Section */}
            <div className="pt-24 sm:pt-32 pb-12 px-4 sm:px-6 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
                </div>

                <div className="max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-6 animate-fade-in">
                        <Zap size={14} className="fill-blue-600" />
                        <span>Live Games Available Now</span>
                    </div>
                    <h1 className="text-5xl sm:text-7xl font-black text-gray-900 tracking-tight mb-6 leading-[1.1]">
                        Refer Fast To <br />
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">Reveal The Winner</span>
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
                        Join the most exciting community pools. Pick your seat, wait for the draw, and win big! Every seat brings you closer to the grand prize.
                    </p>
                </div>

                {/* Pool Grid */}
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 gap-8">
                        {pools.length === 0 ? (
                            <div className="text-center py-24 bg-white/50 backdrop-blur-sm border border-gray-100 rounded-3xl shadow-sm">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Ticket className="text-gray-300" size={32} />
                                </div>
                                <p className="text-gray-500 font-medium text-lg">
                                    No active pools available at the moment.
                                </p>
                                <p className="text-gray-400 text-sm mt-1">Please check back later for new opportunities.</p>
                            </div>
                        ) : (
                            pools.map((pool, index) => {
                                const style = styling[index % styling.length];
                                const isSoldOut = (pool.activeRound?.availableSeats ?? 0) <= 0;
                                const digits = String(pool.activeRound?.availableSeats ?? 0).padStart(3, '0').split('');
                                
                                const price = parseInt(pool.perSeatPrice);
                                let poolImage = "/poolimages/200.png";
                                if (price > 700) {
                                    poolImage = "/poolimages/1000.png";
                                } else if (price >= 300) {
                                    poolImage = "/poolimages/500.png";
                                }

                                const poolUrl = `/pools/${pool.publicId}`;
                                const targetUrl = isLoggedIn ? poolUrl : `/login?redirect=${encodeURIComponent(poolUrl)}`;

                                return (
                                    <Link 
                                        href={targetUrl}
                                        key={pool.publicId} 
                                        className={`group relative w-full flex flex-row bg-linear-to-br ${style.gradient} rounded-2xl sm:rounded-[2.5rem] p-0.5 sm:p-1 shadow-xl ${style.shadow} transition-all duration-500 hover:scale-[1.01] sm:hover:scale-[1.02] ${isSoldOut ? 'opacity-70 grayscale-[0.5] cursor-not-allowed' : ''}`}
                                        style={{ pointerEvents: isSoldOut ? 'none' : 'auto' }}
                                    >
                                        {/* Inner Container with Glass Effect */}
                                        <div className="relative flex flex-row w-full bg-white/5 backdrop-blur-md rounded-[0.9rem] sm:rounded-[2.3rem] overflow-hidden">
                                            
                                            {/* Left Info Section */}
                                            <div className="flex-1 p-3 sm:p-8 md:p-10 flex flex-col justify-between z-10 min-w-0">
                                                <div>
                                                    <div className="hidden sm:flex items-center gap-2 mb-4">
                                                        <span className={`px-3 py-1 rounded-full ${style.accent} border ${style.border} text-white text-[10px] font-bold uppercase tracking-wider`}>
                                                            {pool.activeRound?.status === "DRAWING" ? "Drawing Live" : "Active Round"}
                                                        </span>
                                                        {isSoldOut && pool.activeRound?.status !== "DRAWING" && (
                                                            <span className="px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-[10px] font-bold uppercase tracking-wider">
                                                                Sold Out
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    <h3 className="text-white/80 text-[10px] sm:text-lg font-medium mb-1 sm:mb-2 uppercase tracking-widest truncate">{pool.name}</h3>
                                                    
                                                    <div className="flex items-baseline gap-1 text-white mb-4 sm:mb-8">
                                                        <span className="text-xl sm:text-4xl font-light opacity-80">₹</span>
                                                        <span className="text-3xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-none">{pool.perSeatPrice}</span>
                                                        <span className="text-[10px] sm:text-xl font-medium opacity-60 ml-1">/ seat</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-3 sm:space-y-6">
                                                    <div>
                                                        <p className="hidden sm:flex text-white/60 text-xs font-bold uppercase tracking-widest mb-3 items-center gap-2">
                                                            <Users size={14} />
                                                            Available Seats
                                                        </p>
                                                        <div className="flex gap-1 sm:gap-2">
                                                            {digits.map((digit, i) => (
                                                                <div 
                                                                    key={i} 
                                                                    className="w-7 h-9 sm:w-12 sm:h-16 md:w-14 md:h-20 bg-white rounded-lg sm:rounded-2xl flex items-center justify-center text-lg sm:text-3xl md:text-4xl font-black text-gray-900 shadow-[0_4px_0_0_#e2e8f0] sm:shadow-[0_8px_0_0_#e2e8f0] transform group-hover:translate-y-[-1px] transition-all duration-300"
                                                                >
                                                                    {digit}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="pt-1 sm:pt-4">
                                                        {pool.activeRound?.status === "DRAWING" && pool.activeRound?.drawnAt ? (
                                                            <div className="bg-white rounded-xl shadow-xl overflow-hidden max-w-[280px]">
                                                                <DrawingTimer drawnAt={pool.activeRound.drawnAt} />
                                                            </div>
                                                        ) : (
                                                            <div className="inline-flex items-center gap-1 sm:gap-3 px-3 py-1.5 sm:px-8 sm:py-4 bg-white text-gray-900 rounded-full font-bold text-xs sm:text-lg transition-all shadow-lg">
                                                                <span className="hidden sm:inline">{isSoldOut ? 'Sold Out' : 'Join Pool'}</span>
                                                                <span className="sm:hidden">{isSoldOut ? 'Sold' : 'Join'}</span>
                                                                {!isSoldOut && <ArrowRight size={14} className="sm:w-5 sm:h-5 text-indigo-600" />}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Image Section */}
                                            <div className="relative w-[35%] sm:w-[45%] overflow-hidden flex items-center justify-center">
                                                <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
                                                <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-8">
                                                    <div className="relative w-full h-full transition-transform duration-700 group-hover:scale-110">
                                                        <Image 
                                                            src={poolImage} 
                                                            alt="Cash Heap" 
                                                            fill
                                                            className="object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] sm:drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                                                            priority
                                                        />
                                                    </div>
                                                </div>
                                                
                                                {/* Decorative background circle */}
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white/10 rounded-full blur-2xl sm:blur-3xl -z-10" />
                                            </div>
                                        </div>

                                        {/* Sold Out Overlay Layer */}
                                        {isSoldOut && (
                                            <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center overflow-hidden rounded-2xl sm:rounded-[2.5rem]">
                                                <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] sm:backdrop-blur-[4px]" />
                                                <div className="relative rotate-[-12deg] bg-white text-gray-900 px-4 py-1 sm:px-10 sm:py-4 font-black text-sm sm:text-4xl uppercase tracking-widest shadow-xl border-2 sm:border-4 border-gray-900">
                                                    Sold Out
                                                </div>
                                            </div>
                                        )}
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.8s ease-out forwards;
                }
            `}} />
        </div>
    );
}
