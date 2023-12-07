import type { Metadata } from "next";
import { Source_Code_Pro } from "next/font/google";
import "./globals.css";

const scp = Source_Code_Pro({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vestberry AoC Leaderboard 2.0",
  description: "Same but better",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={scp.className}>{children}</body>
    </html>
  );
}
