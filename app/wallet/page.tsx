import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen bg-[#FAF8F2] dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="font-serif text-2xl text-gray-900 dark:text-white">Your wallet</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            A running record of every ticket you've bought and every prize you've won.
          </p>
        </div>

        <WalletLedger balance={balance} entries={entries} pagination={pagination} />
      </main>
    </div>
  );
}
