"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, LogIn, Menu, Ticket, Trophy, Wallet, X } from "lucide-react";
import NextDrawBar from "./NextDrawBar";

type NavLink = { href: string; label: string; icon: typeof Ticket };

const PUBLIC_LINKS: NavLink[] = [
  { href: "/games", label: "Games", icon: Ticket },
  { href: "/results", label: "Results", icon: Trophy },
];

const MEMBER_LINKS: NavLink[] = [
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/dashboard", label: "My tickets", icon: LayoutDashboard },
];

export default function Navbar({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const links = isLoggedIn ? [...PUBLIC_LINKS, ...MEMBER_LINKS] : PUBLIC_LINKS;
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Close the mobile menu whenever the route changes, or on Escape.
  useEffect(() => setIsOpen(false), [pathname]);
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur dark:bg-gray-900 shadow-sm border-b border-brand-100 z-50" aria-label="Main">
      {/* Persistent next-draw strip — sits above the main nav row so every
          page (via Navbar) surfaces the live/next round without extra wiring */}
      <NextDrawBar />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 min-w-0" aria-label="Haryana Lottery home">
            <div className="w-9 h-9 shrink-0 bg-gradient-to-br from-brand-500 to-brand-800 rounded-xl flex items-center justify-center ring-2 ring-gold-400/70">
              <span className="text-white font-extrabold text-base tracking-tight">HL</span>
            </div>
            <span className="text-lg font-extrabold text-ink dark:text-white hidden sm:inline truncate">
              Haryana Lottery
            </span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={`relative px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isActive(href)
                    ? "text-brand-700 bg-brand-50"
                    : "text-gray-600 hover:text-brand-700 hover:bg-brand-50/60"
                }`}
              >
                {label}
                {isActive(href) && (
                  <span className="absolute left-3 right-3 -bottom-[13px] h-0.5 rounded-full bg-gold-400" />
                )}
              </Link>
            ))}
          </div>

          {/* Auth buttons + mobile toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex items-center px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg transition font-semibold text-sm"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 text-brand-700 hover:bg-brand-50 rounded-lg transition font-semibold text-sm"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-3.5 py-2 bg-gold-400 hover:bg-gold-300 text-ink rounded-lg transition font-bold text-sm shadow-sm"
                >
                  Sign up
                </Link>
              </>
            )}

            <button
              type="button"
              className="md:hidden p-2 -mr-1 rounded-lg text-gray-700 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-600"
              onClick={() => setIsOpen((o) => !o)}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-brand-100 bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-3 py-3 space-y-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-base font-semibold ${
                  isActive(href) ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
            {!isLoggedIn && (
              <Link
                href="/login"
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-base font-semibold text-gray-700 hover:bg-gray-50"
              >
                <LogIn className="w-5 h-5" />
                Log in
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
