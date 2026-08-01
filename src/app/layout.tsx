import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Nav from "@/components/Nav";
import { MISS_SCORE, getActiveWeek, getScoresForWeek } from "@/lib/data";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Wordle Cup",
  description: "Daily Wordle scores and weekly bragging rights for the family",
};

function moodHue(average: number | null): number {
  if (average === null) return 142; // no data yet -- default to a fresh green
  const clamped = Math.max(1, Math.min(6, average));
  return 142 - ((clamped - 1) / 5) * 142; // 1 guess -> green (142), 6 -> red (0)
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const week = await getActiveWeek();
  const scores = await getScoresForWeek(week.id);
  const real = scores.map((s) => s.guesses).filter((g) => g < MISS_SCORE);
  const average = real.length
    ? real.reduce((a, b) => a + b, 0) / real.length
    : null;
  const hue = moodHue(average);

  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10"
          style={{
            background: `radial-gradient(ellipse 80% 50% at 50% -10%, hsl(${hue} 70% 30% / 0.3), transparent 70%)`,
          }}
        />
        <Nav />
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
