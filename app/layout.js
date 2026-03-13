// Google Fonts blocked in build environment - using system fonts
// import { Inter } from "next/font/google";
import "./globals.css";
import "./print.css";
import Script from "next/script";
import { Providers } from "./providers";
// const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  metadataBase: new URL('https://www.datapalo.app'),
  title: {
    template: '%s | DataPalo',
    default: 'DataPalo — Upload a File. Get Answers in Seconds.',
  },
  description:
    'Drop any CSV or Excel file — get charts, insights, and reports instantly. Free to start, no skills required.',
  openGraph: {
    title: 'DataPalo — Upload a File. Get Answers in Seconds.',
    description:
      'Drop any CSV or Excel file — get charts, insights, and reports instantly. Free to start, no skills required.',
    url: 'https://www.datapalo.app',
    siteName: 'DataPalo',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DataPalo — AI-powered data analysis for everyone',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DataPalo — Upload a File. Get Answers in Seconds.',
    description:
      'Drop any CSV or Excel file — get charts, insights, and reports instantly. Free to start, no skills required.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/',
      'cs-CZ': '/',
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <Providers>
          {children}
        </Providers>
        
        {/* --- GOOGLE ANALYTICS (Traffic) --- */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-FQ11DN6HD9"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-FQ11DN6HD9');
          `}
        </Script>

        {/* --- HOTJAR (Behavior) --- */}
        <Script id="hotjar-tracking" strategy="afterInteractive">
          {`
            (function(h,o,t,j,a,r){
                h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                h._hjSettings={hjid:6601763,hjsv:6};
                a=o.getElementsByTagName('head')[0];
                r=o.createElement('script');r.async=1;
                r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                a.appendChild(r);
            })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
          `}
        </Script>
        
      </body>
    </html>
  );
}