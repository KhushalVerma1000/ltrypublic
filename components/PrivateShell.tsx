import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";
import AccountTabs from "@/components/AccountTabs";

/**
 * Frame for every signed-in page (/dashboard, /wallet, …).
 * Public pages render <Navbar> directly on a light page; private pages go
 * through this shell so they always get the same account top bar, the green
 * "My account" header and the Overview / Wallet tabs.
 */
export default async function PrivateShell({
  title,
  subtitle,
  children,
  widthClass = "max-w-7xl",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  widthClass?: string;
}) {
  const cookieStore = await cookies();
  const isLoggedIn = !!(cookieStore.get("accessToken") || cookieStore.get("refreshToken"));

  return (
    <div className="min-h-screen bg-paper dark:bg-gray-950">
      <Navbar isLoggedIn={isLoggedIn} />

      {/* 100px = 36px next-draw strip + 64px nav row */}
      <div className="pt-[100px]">
        <header className="bg-brand-900 text-white">
          <div className={`${widthClass} mx-auto px-3 sm:px-6 lg:px-8 pt-5 sm:pt-7`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-300">My account</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">{title}</h1>
            {subtitle && <p className="text-sm text-brand-200 mt-1 max-w-2xl">{subtitle}</p>}
            <div className="mt-4">
              <AccountTabs />
            </div>
          </div>
        </header>

        <main className={`${widthClass} mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8`}>{children}</main>
      </div>
    </div>
  );
}
