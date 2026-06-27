import type { Metadata, Viewport } from "next";
import {
  Fredoka,
  Nunito,
  Fraunces,
  Space_Grotesk,
  Geist,
  Geist_Mono,
} from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});
const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Budget Friendly — split any amount, your way",
  description:
    "A flexible percentage budget calculator. Start at 100%, carve it into your own named buckets, and see the real amounts. The 50/30/20 rule is just a starting point.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

// Set the saved theme before paint to avoid a flash of the default theme.
const noFlashTheme = `(function(){try{var t=localStorage.getItem('bf-theme');var allowed=['candy','pastel','sunset','fintech','forest','retro','mono','mono-inverse','brutalist','midnight','noir','terminal','aurora','mocha'];document.documentElement.dataset.theme=allowed.indexOf(t)>-1?t:'candy';}catch(e){document.documentElement.dataset.theme='candy';}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const fontVars = [
    fredoka.variable,
    nunito.variable,
    fraunces.variable,
    spaceGrotesk.variable,
    geist.variable,
    geistMono.variable,
  ].join(" ");

  return (
    <html
      lang="en"
      data-theme="candy"
      suppressHydrationWarning
      className={`${fontVars} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashTheme }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
