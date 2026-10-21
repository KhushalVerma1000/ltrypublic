import { cookies } from "next/headers";
import PrivateShell from "@/components/PrivateShell";
import WalletLedger from "@/components/WalletLedger";

async function getLedger(page = 1, limit = 15) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;

  const empty = { balance: "0", data: [], pagination: { page: 1, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };

  if (!accessToken && !refreshToken) return empty;

  try {
    const res = await fetch(`${process.env.API_URL}/ledger/me?page=${page}&limit=${limit}`, {
      headers: {
        Cookie: `accessToken=${accessToken || ""}; refreshToken=${refreshToken || ""}`,
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) return empty;
    const json = await res.json();
    return json.success ? json.data : empty;
  } catch (e) {
    console.error("Error fetching ledger:", e);
    return empty;
  }
}

export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = typeof params.page === "string" ? parseInt(params.page) : 1;

  const { balance, data: entries, pagination } = await getLedger(page, 15);

  return (
    <PrivateShell
      title="Your wallet"
      subtitle="A running record of every ticket you've bought and every prize you've won."
      widthClass="max-w-4xl"
    >
      <WalletLedger balance={balance} entries={entries} pagination={pagination} />
    </PrivateShell>
  );
}
