import type { Metadata, Viewport } from "next";
import {
  Space_Grotesk,
  Fredoka,
  Geist,
  Fraunces,
  Quicksand,
  DM_Serif_Display,
  Sora,
  Playfair_Display,
  IBM_Plex_Mono,
  Lexend,
  JetBrains_Mono,
  Bricolage_Grotesque,
  Spectral,
  Space_Mono,
} from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

// One distinct family per theme (see the [data-theme] blocks in globals.css),
// so switching themes changes the whole typographic character.
const spaceGrotesk = Space_Grotesk({ variable: "--font-space", subsets: ["latin"] }); // brutalist
const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"] }); // candy
const geist = Geist({ variable: "--font-geist", subsets: ["latin"] }); // fintech
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] }); // mocha
const quicksand = Quicksand({ variable: "--font-quicksand", subsets: ["latin"] }); // pastel
const dmSerif = DM_Serif_Display({ variable: "--font-dm-serif", subsets: ["latin"], weight: "400" }); // sunset
const sora = Sora({ variable: "--font-sora", subsets: ["latin"] }); // midnight
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] }); // noir
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500", "600", "700"] }); // terminal
const lexend = Lexend({ variable: "--font-lexend", subsets: ["latin"] }); // aurora
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] }); // mono
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] }); // retro
const spectral = Spectral({ variable: "--font-spectral", subsets: ["latin"], weight: ["400", "500", "600", "700"] }); // forest
const spaceMono = Space_Mono({ variable: "--font-space-mono", subsets: ["latin"], weight: ["400", "700"] }); // mono-inverse

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

const description =
  "A flexible percentage budget calculator. Start at 100%, carve it into your own named buckets, and see the real amounts. The 50/30/20 rule is just a starting point.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Budget Friendly — split any amount, your way",
    template: "%s · Budget Friendly",
  },
  description,
  applicationName: "Budget Friendly",
  appleWebApp: {
    capable: true,
    title: "Budget Friendly",
    statusBarStyle: "default",
  },
  keywords: [
    "budget calculator",
    "budgeting app",
    "percentage budget",
    "50/30/20 rule",
    "money split",
    "personal finance",
    "savings planner",
    "budget planner",
    "expense allocation",
    "naira budget",
  ],
  authors: [{ name: "Budget Friendly" }],
  creator: "Budget Friendly",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Budget Friendly",
    url: siteUrl,
    locale: "en_US",
    title: "Budget Friendly — split any amount, your way",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Budget Friendly — split any amount, your way",
    description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  category: "finance",
};

export const viewport: Viewport = {
  themeColor: "#f2f2f2",
  width: "device-width",
  initialScale: 1,
};

// Set the saved theme before paint to avoid a flash of the default theme.
const noFlashTheme = `(function(){try{var t=localStorage.getItem('bf-theme');var allowed=['candy','pastel','sunset','fintech','forest','retro','mono','mono-inverse','brutalist','midnight','noir','terminal','aurora','mocha'];document.documentElement.dataset.theme=allowed.indexOf(t)>-1?t:'brutalist';}catch(e){document.documentElement.dataset.theme='brutalist';}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const fontVars = [
    spaceGrotesk.variable,
    fredoka.variable,
    geist.variable,
    fraunces.variable,
    quicksand.variable,
    dmSerif.variable,
    sora.variable,
    playfair.variable,
    plexMono.variable,
    lexend.variable,
    jetbrains.variable,
    bricolage.variable,
    spectral.variable,
    spaceMono.variable,
  ].join(" ");

  return (
    <html
      lang="en"
      data-theme="brutalist"
      suppressHydrationWarning
      className={`${fontVars} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashTheme }} />
      </head>
      <body className="min-h-full">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
