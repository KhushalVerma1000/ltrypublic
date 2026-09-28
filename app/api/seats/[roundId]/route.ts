import { NextRequest, NextResponse } from "next/server";

// Thin same-origin proxy so the client can poll seat availability directly
// (seat status is public, no auth needed) without exposing the backend's
// API_URL to the browser or needing CORS configured there.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roundId: string }> }
) {
  const { roundId } = await params;

  try {
    const res = await fetch(`${process.env.API_URL}/seats/round/${roundId}`, {
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ success: false, message: "Unable to reach booking server" }, { status: 502 });
  }
}
