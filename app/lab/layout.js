import Script from 'next/script';

export const metadata = {
  title: 'AI LAB | Ovládněte systémy',
  description: 'Nezávislý technologický inkubátor. Konec AI teoriím, stavíme reálné produkční systémy.',
  openGraph: {
    title: 'AI LAB | Ovládněte systémy.',
    description: 'Nezávislý technologický inkubátor. Konec AI teoriím, stavíme reálné produkční systémy.',
    url: 'https://ailab-cl.cz',
    siteName: 'AI LAB',
    locale: 'cs_CZ',
    type: 'website',
  },
};

export default function LabLayout({ children }) {
  return (
    <>
      {children}
      
      {/* --- GOOGLE ANALYTICS (Optimalizované pro Next.js) --- */}
      <Script 
        src="https://www.googletagmanager.com/gtag/js?id=G-K9GEY1PRJ1" 
        strategy="afterInteractive" 
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-K9GEY1PRJ1');
        `}
      </Script>
    </>
  );
}