import { NextResponse } from "next/server";

// Client components can't hit the backend directly (no NEXT_PUBLIC API URL /
// CORS setup), so this same-origin route proxies the public pools list
// server-side. Used by NextDrawBar for the site-wide "next draw" countdown.
export async function GET() {
  try {
    const res = await fetch(`${process.env.API_URL}/pools`, {
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, data: [] }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error proxying /pools:", e);
    return NextResponse.json({ success: false, data: [] }, { status: 502 });
  }
}
