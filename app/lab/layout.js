export const metadata = {
  title: 'AI LAB | Ovládněte systémy',
  description: 'Nezávislý technologický inkubátor. Vývojářská laboratoř pro aplikovanou umělou inteligenci.',
  openGraph: {
    title: 'AI LAB | Ovládněte systémy',
    description: 'Nezávislý technologický inkubátor. Konec AI teorie, stavíme reálné produkční systémy.',
    url: 'https://ailab-cl.cz',
    siteName: 'AI LAB',
    locale: 'cs_CZ',
    type: 'website',
  },
};

export default function LabLayout({ children }) {
  return <>{children}</>;
}