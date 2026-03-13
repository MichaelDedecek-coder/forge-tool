export default function sitemap() {
  const baseUrl = 'https://www.datapalo.app'

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
      alternates: {
        languages: {
          en: baseUrl,
          cs: baseUrl,
        },
      },
    },
    {
      url: `${baseUrl}/datapalo`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: {
          en: `${baseUrl}/datapalo`,
          cs: `${baseUrl}/datapalo`,
        },
      },
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: {
        languages: {
          en: `${baseUrl}/pricing`,
          cs: `${baseUrl}/pricing`,
        },
      },
    },
  ]
}
