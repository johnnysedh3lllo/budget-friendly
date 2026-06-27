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
      data-theme="brutalist"
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
