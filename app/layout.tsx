import type { Metadata } from "next";
import Script from "next/script";
import { Space_Grotesk, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { AcademyProvider } from "./providers";
import "./globals.css";

const GTM_ID = "GTM-NG7QXZ8H";

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
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            title="Google Tag Manager"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
        <AcademyProvider>{children}</AcademyProvider>
        {/* Google Tag Manager */}
        <Script
          id="gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`,
          }}
        />
      </body>
    </html>
  );
}
