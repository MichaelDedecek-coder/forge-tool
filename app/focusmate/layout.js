// Using system fonts for better performance and reliability
const inter = { className: 'font-sans' };

export const metadata = {
  title: "FocusMate — AI Executive Assistant for Google Workspace",
  description: "Your morning briefing, automated. FocusMate synthesizes your Gmail, Calendar, and Tasks into one daily email. Know exactly what needs attention.",
  keywords: "AI assistant, executive assistant, productivity, Google Workspace, Gmail, Calendar, email management, time management",
  authors: [{ name: "FORGE CREATIVE" }],
  creator: "FORGE CREATIVE",
  publisher: "FORGE CREATIVE",

  // Open Graph
  openGraph: {
    title: "FocusMate — Your Morning Briefing, Automated",
    description: "AI executive assistant for Google Workspace. One email at 8am tells you exactly what needs attention today.",
    url: "https://focusmateapp.com",
    siteName: "FocusMate",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/focusmate-og.png",
        width: 1200,
        height: 630,
        alt: "FocusMate - AI Executive Assistant",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "FocusMate — Your Morning Briefing, Automated",
    description: "AI executive assistant for Google Workspace. One email at 8am tells you exactly what needs attention today.",
    images: ["/focusmate-og.png"],
  },

  // Additional Meta
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Verification (add when available)
  // verification: {
  //   google: 'verification_token',
  // },
};

export default function FocusMateLayout({ children }) {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "FocusMate",
            "applicationCategory": "ProductivityApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "29",
              "priceCurrency": "EUR",
              "priceValidUntil": "2026-12-31",
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "ratingCount": "0",
              "bestRating": "5",
            },
            "description": "AI Executive Assistant that lives inside Google Workspace. Daily briefing with calendar overview, email triage, and meeting context.",
            "creator": {
              "@type": "Organization",
              "name": "FORGE CREATIVE",
              "url": "https://aijob.agency",
            },
          }),
        }}
      />

      {/* Organization Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "FORGE CREATIVE",
            "url": "https://aijob.agency",
            "logo": "https://aijob.agency/logo.png",
            "description": "AI Workforce Solutions - Hire AI, Not Complexity",
            "slogan": "Meaning > Money",
          }),
        }}
      />

      <div className={inter.className}>{children}</div>
    </>
  );
}
