import Link from "next/link";
import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";
import JackpotHero from "@/components/JackpotHero";
import { ArrowRight } from "lucide-react";

async function getLivePools() {
  try {
    const res = await fetch(`${process.env.API_URL}/pools`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.success && Array.isArray(data.data)
      ? data.data.filter((p: any) => p.activeRound && p.activeRound.status !== "CLOSED")
      : [];
  } catch (e) {
    return [];
  }
}

export default async function Home() {
  // Check if user is logged in
  const cookieStore = await cookies();
  const isLoggedIn = !!cookieStore.get("accessToken");
  const livePools = await getLivePools();
  const popularPools = livePools.slice(0, 2);

  const totalPrizePool = livePools.reduce(
    (sum: number, p: any) => sum + (p.activeRound?.prizePool ?? 0),
    0
  );

  // Feature whichever round closes soonest — the one a visitor should act on first
  const featuredPool = [...livePools].sort((a: any, b: any) => {
    const aTarget = new Date(a.activeRound.status === "DRAWING" && a.activeRound.drawnAt ? a.activeRound.drawnAt : a.activeRound.endsAt).getTime();
    const bTarget = new Date(b.activeRound.status === "DRAWING" && b.activeRound.drawnAt ? b.activeRound.drawnAt : b.activeRound.endsAt).getTime();
    return aTarget - bTarget;
  })[0];

  const featured = featuredPool
    ? {
        poolName: featuredPool.name,
        roundNumber: featuredPool.activeRound.roundNumber,
        availableSeats: featuredPool.activeRound.availableSeats,
        totalSeats: featuredPool.totalSeats,
        endsAt: featuredPool.activeRound.endsAt,
        drawnAt: featuredPool.activeRound.drawnAt,
        isDrawing: featuredPool.activeRound.status === "DRAWING"
      }
    : null;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar isLoggedIn={isLoggedIn} />

      {/* Hero Section */}
      {/* pt-[148px] = 112px original hero spacing + 36px reserved for the
          persistent next-draw strip Navbar renders when a round is live */}
      <section className="pt-[148px] pb-20 px-4 sm:px-6 lg:px-8 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-4">
                {featured ? `Round ${featured.roundNumber} closes soon` : "Haryana Lottery"}
              </p>
              <h1 className="text-5xl md:text-6xl text-navy mb-5 leading-[1.05]">
                Pick your seats.{" "}
                <span className="text-purple-600">Win the pool.</span>
              </h1>
              <p className="text-base text-gray-500 dark:text-gray-400 mb-8 leading-relaxed max-w-md">
                Choose up to 4 seats. When the round fills, winners are drawn live and paid to your wallet.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={featured ? `/pools/${featuredPool.publicId}?roundId=${featuredPool.activeRound.publicId}` : "/games"}
                  className="px-6 py-2.5 btn-primary text-sm text-center"
                >
                  Pick your seats
                </Link>
                <Link
                  href="/results"
                  className="btn-secondary px-6 py-2.5 text-sm text-center"
                >
                  View results
                </Link>
              </div>
            </div>

            {/* Jackpot Card */}
            <JackpotHero totalPrizePool={totalPrizePool} featured={featured} />
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-2">Popular games</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Choose your game and start playing</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
             {popularPools.map((pool: any) => (
               <Link 
                 href={pool.activeRound ? `/pools/${pool.publicId}?roundId=${pool.activeRound.publicId}` : `/pools/${pool.publicId}`}
                 key={pool.publicId}
                 className="group border border-gray-100 dark:border-gray-800 rounded-2xl p-8 bg-white dark:bg-gray-900 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
               >
                 <div>
                   <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                     ₹{pool.perSeatPrice}
                   </div>
                   <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 uppercase tracking-wider font-semibold">
                     {pool.name}
                   </p>
                 </div>
                 <div className="flex items-center justify-between mt-4">
                   <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-tighter">
                     {pool.activeRound?.availableSeats ?? 0} seats left
                   </span>
                   <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                     <ArrowRight className="w-4 h-4" />
                   </div>
                 </div>
               </Link>
             ))}
             
             <div className="border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-8 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col justify-center items-center text-center">
                 <p className="text-gray-500 text-sm mb-4">See every pool that is open right now.</p>
                 <Link href="/games" className="px-6 py-2.5 btn-primary rounded-xl font-bold text-sm transition-colors shadow-lg shadow-purple-200 dark:shadow-none">
                     Browse all games
                 </Link>
             </div>
          </div>
        </div>
      </section>

      {/* Trust band: plain statements, no icons or claims we cannot back up */}
      <section className="bg-white border-y border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row sm:justify-between gap-2 text-sm font-bold text-navy">
          <span>Draws happen in public</span>
          <span>Payments secured by Razorpay</span>
          <span>Winnings go to your wallet</span>
        </div>
      </section>

      {/* How a round works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl text-navy mb-8">How a round works</h2>
          <div className="grid md:grid-cols-[1.2fr_1fr] gap-5">
            <div className="bg-white border-2 border-navy rounded-[18px] shadow-[0_5px_0_var(--color-navy)] p-8">
              <p className="font-display font-extrabold text-6xl text-purple-600">1</p>
              <h3 className="font-display font-extrabold text-2xl text-navy mt-1">Choose a round</h3>
              <p className="text-navy/70 mt-2 max-w-sm">Each card shows its prize pool, seat price and when it closes.</p>
            </div>
            <div className="grid gap-5">
              <div className="bg-white border-2 border-navy rounded-[18px] shadow-[0_5px_0_var(--color-navy)] p-6">
                <p className="font-display font-extrabold text-3xl text-purple-600">2</p>
                <h3 className="font-display font-extrabold text-lg text-navy">Pick your seats</h3>
                <p className="text-sm text-navy/70 mt-1">Tap seats yourself or let us pick. We hold them while you pay.</p>
              </div>
              <div className="bg-white border-2 border-navy rounded-[18px] shadow-[0_5px_0_var(--color-navy)] p-6">
                <p className="font-display font-extrabold text-3xl text-purple-600">3</p>
                <h3 className="font-display font-extrabold text-lg text-navy">Watch the draw</h3>
                <p className="text-sm text-navy/70 mt-1">Winners are drawn publicly and paid to your wallet.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl text-navy mb-2">Ready to pick your seats?</h2>
          <p className="text-sm text-gray-500 mb-6">
            Create an account in a minute. You only pay when you book seats.
          </p>
          <Link
            href="/signup"
            className="inline-block px-6 py-2.5 btn-primary rounded-lg font-medium text-sm transition-colors"
          >
            Create account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Haryana Lottery</p>
              <p className="text-xs text-gray-400 leading-relaxed">Safe, transparent lottery games.<br />Play responsibly.</p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-900 dark:text-white mb-3">Company</p>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">About us</Link></li>
                <li><Link href="/careers" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Careers</Link></li>
                <li><Link href="/press" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Press</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-900 dark:text-white mb-3">Legal</p>
              <ul className="space-y-2">
                <li><Link href="/terms" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Terms</Link></li>
                <li><Link href="/privacy" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Privacy</Link></li>
                <li><Link href="/responsible" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Responsible gaming</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-900 dark:text-white mb-3">Support</p>
              <ul className="space-y-2">
                <li><Link href="/help" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Help center</Link></li>
                <li><Link href="/contact" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Contact us</Link></li>
                <li><Link href="/faq" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">FAQ</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} Haryana Lottery. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}