import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await params;

  try {
    const res = await fetch(`${process.env.API_URL}/bookings/lookup/${encodeURIComponent(ticketId)}`, {
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error("Error proxying ticket lookup:", e);
    return NextResponse.json(
      { success: false, message: "Couldn't reach the lookup service. Try again in a moment." },
      { status: 502 }
    );
  }
}
