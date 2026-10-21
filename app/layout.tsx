import type { Metadata } from "next";
import { Baloo_2, DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import { UserProvider } from "./context/UserContext";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["600", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Haryana Lottery",
  description: "Pick your seats, watch the draw, and get paid to your wallet.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const rawUser = cookieStore.get("user")?.value;
  let user = null;
  if (rawUser) {
    try {
      user = JSON.parse(rawUser);
    } catch {}
  }

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${baloo.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Toaster position="top-center" richColors />
        <UserProvider user={user}>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
