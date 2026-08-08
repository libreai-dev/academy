import type { Metadata } from "next";
import { Space_Grotesk, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { AcademyProvider } from "./providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.libreai.dev/academy"),
  title: "libreai Academy — become an AI-native engineer",
  description:
    "A hands-on, bilingual guide for software engineers who don't yet know AI — from how models work to running your own.",
};

// Apply the saved theme (and language) before first paint to avoid a flash of
// the wrong palette. Kept intentionally tiny and dependency-free.
const noFlashScript = `(function(){try{var t=localStorage.getItem('libreai-academy-theme');if(t!=='dark')t='light';document.documentElement.setAttribute('data-theme',t);var l=localStorage.getItem('libreai-academy-lang');if(l==='es')document.documentElement.setAttribute('lang','es');}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${instrumentSans.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
        <AcademyProvider>{children}</AcademyProvider>
      </body>
    </html>
  );
}
