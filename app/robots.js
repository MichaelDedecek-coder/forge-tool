export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/data/'],
    },
    sitemap: 'https://focusmateapp.com/sitemap.xml',
  }
}
