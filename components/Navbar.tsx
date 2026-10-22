"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutDashboard, LogIn, LogOut, Menu, Ticket, Trophy, Wallet, X } from "lucide-react";
import NextDrawBar from "./NextDrawBar";
import { useUser } from "@/app/context/UserContext";
import { logoutAction } from "@/app/dashboard/action";

type NavLink = { href: string; label: string; icon: typeof Ticket };

// Open to everyone
const PUBLIC_LINKS: NavLink[] = [
  { href: "/games", label: "Games", icon: Ticket },
  { href: "/results", label: "Results", icon: Trophy },
];

// Signed-in only
const MEMBER_LINKS: NavLink[] = [
  { href: "/dashboard", label: "My tickets", icon: LayoutDashboard },
  { href: "/wallet", label: "Wallet", icon: Wallet },
];

// Pages that live in the private area get the dark "account" bar.
const PRIVATE_PREFIXES = ["/dashboard", "/wallet"];

export default function Navbar({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const user = useUser();

  const loggedIn = isLoggedIn || !!user;
  const isPrivate = PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const initial = (user?.name?.trim()[0] ?? "P").toUpperCase();
  const firstName = user?.name?.trim().split(" ")[0] ?? "Account";

  // Close menus on route change, Escape, or outside click.
  useEffect(() => {
    setMenuOpen(false);
    setUserOpen(false);
  }, [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setUserOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, []);

  // Dark bar inside the private area, light bar on public pages.
  const t = isPrivate
    ? {
        nav: "bg-brand-900 border-b border-white/10 text-white",
        logoText: "text-white",
        link: "text-brand-100 hover:text-white hover:bg-white/10",
        linkActive: "text-white bg-white/10",
        underline: "bg-gold-400",
        divider: "bg-white/15",
        iconBtn: "text-white hover:bg-white/10",
        ghost: "text-white hover:bg-white/10",
      }
    : {
        nav: "bg-white/95 backdrop-blur border-b border-brand-100 shadow-sm",
        logoText: "text-ink",
        link: "text-gray-600 hover:text-brand-700 hover:bg-brand-50/60",
        linkActive: "text-brand-700 bg-brand-50",
        underline: "bg-gold-400",
        divider: "bg-brand-100",
        iconBtn: "text-gray-700 hover:bg-brand-50",
        ghost: "text-brand-700 hover:bg-brand-50",
      };

  const desktopLink = ({ href, label }: NavLink) => (
    <Link
      key={href}
      href={href}
      aria-current={isActive(href) ? "page" : undefined}
      className={`relative px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive(href) ? t.linkActive : t.link}`}
    >
      {label}
      {isActive(href) && <span className={`absolute left-3 right-3 -bottom-[13px] h-0.5 rounded-full ${t.underline}`} />}
    </Link>
  );

  return (
    <nav className={`fixed top-0 w-full z-50 ${t.nav}`} aria-label="Main">
      {/* Persistent next-draw strip — same on public and private pages */}
      <NextDrawBar />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 min-w-0" aria-label="Haryana Lottery home">
            <div className="w-9 h-9 shrink-0 bg-gradient-to-br from-brand-500 to-brand-800 rounded-xl flex items-center justify-center ring-2 ring-gold-400/70">
              <span className="text-white font-extrabold text-base tracking-tight">HL</span>
            </div>
            <span className={`text-lg font-extrabold hidden sm:inline truncate ${t.logoText}`}>Haryana Lottery</span>
          </Link>

          {/* Desktop navigation: public links, then (signed in) a divider and the account links */}
          <div className="hidden md:flex items-center gap-1">
            {PUBLIC_LINKS.map(desktopLink)}
            {loggedIn && (
              <>
                <span className={`mx-2 h-5 w-px ${t.divider}`} aria-hidden />
                {MEMBER_LINKS.map(desktopLink)}
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {loggedIn ? (
              <div className="relative hidden md:block" ref={userRef}>
                <button
                  type="button"
                  onClick={() => setUserOpen((o) => !o)}
                  aria-expanded={userOpen}
                  aria-haspopup="menu"
                  className={`flex items-center gap-2 pl-1 pr-2 py-1 rounded-full transition-colors ${t.ghost}`}
                >
                  <span className="w-8 h-8 rounded-full bg-gold-400 text-ink font-extrabold text-sm flex items-center justify-center">
                    {initial}
                  </span>
                  <span className="text-sm font-semibold max-w-[8rem] truncate">{firstName}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${userOpen ? "rotate-180" : ""}`} />
                </button>
                {userOpen && (
                  <div role="menu" className="absolute right-0 mt-2 w-56 rounded-xl bg-white text-ink shadow-xl border border-brand-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-brand-100">
                      <p className="text-sm font-bold truncate">{user?.name ?? "Player"}</p>
                      {user?.phone && <p className="text-xs text-gray-500">{user.phone}</p>}
                    </div>
                    <Link href="/dashboard" role="menuitem" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-brand-50">
                      <LayoutDashboard className="w-4 h-4 text-brand-600" /> My tickets
                    </Link>
                    <Link href="/wallet" role="menuitem" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-brand-50">
                      <Wallet className="w-4 h-4 text-brand-600" /> Wallet
                    </Link>
                    <form action={logoutAction} className="border-t border-brand-100">
                      <button type="submit" role="menuitem" className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left text-rose-700 hover:bg-rose-50">
                        <LogOut className="w-4 h-4" /> Log out
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className={`px-3 py-2 rounded-lg transition font-semibold text-sm ${t.ghost}`}>
                  Log in
                </Link>
                <Link href="/signup" className="px-3.5 py-2 bg-gold-400 hover:bg-gold-300 text-ink rounded-lg transition font-bold text-sm shadow-sm">
                  Sign up
                </Link>
              </>
            )}

            <button
              type="button"
              className={`md:hidden p-2 -mr-1 rounded-lg focus-visible:outline-2 focus-visible:outline-gold-400 ${t.iconBtn}`}
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu — always shows the full navigation */}
      {menuOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-brand-100 bg-white text-ink shadow-lg max-h-[calc(100vh-100px)] overflow-y-auto">
          <div className="max-w-7xl mx-auto px-3 py-3 space-y-1">
            {loggedIn && (
              <div className="flex items-center gap-3 px-3 py-2 mb-1">
                <span className="w-10 h-10 rounded-full bg-gold-400 text-ink font-extrabold flex items-center justify-center">{initial}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{user?.name ?? "Player"}</p>
                  {user?.phone && <p className="text-xs text-gray-500">{user.phone}</p>}
                </div>
              </div>
            )}

            <p className="px-3 pt-1 text-2xs font-bold uppercase tracking-widest text-gray-400">Explore</p>
            {PUBLIC_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-base font-semibold ${isActive(href) ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-gray-50"}`}
              >
                <Icon className="w-5 h-5" /> {label}
              </Link>
            ))}

            {loggedIn ? (
              <>
                <p className="px-3 pt-3 text-2xs font-bold uppercase tracking-widest text-gray-400">My account</p>
                {MEMBER_LINKS.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    aria-current={isActive(href) ? "page" : undefined}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-base font-semibold ${isActive(href) ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-gray-50"}`}
                  >
                    <Icon className="w-5 h-5" /> {label}
                  </Link>
                ))}
                <form action={logoutAction} className="pt-2 mt-2 border-t border-brand-100">
                  <button type="submit" className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-base font-semibold text-rose-700 hover:bg-rose-50">
                    <LogOut className="w-5 h-5" /> Log out
                  </button>
                </form>
              </>
            ) : (
              <Link href="/login" className="flex items-center gap-3 px-3 py-3 rounded-xl text-base font-semibold text-gray-700 hover:bg-gray-50">
                <LogIn className="w-5 h-5" /> Log in
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
