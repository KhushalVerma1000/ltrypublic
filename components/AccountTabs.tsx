"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/wallet", label: "Wallet" },
];

/** Sub-navigation shared by every page in the private (signed-in) area. */
export default function AccountTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="flex gap-1 overflow-x-auto -mb-px">
      {TABS.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              active
                ? "border-gold-400 text-white"
                : "border-transparent text-brand-200 hover:text-white hover:border-white/30"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
