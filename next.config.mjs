/** @type {import('next').NextConfig} */
const nextConfig = {
  // Include @sparticuz/chromium binary in the export-pdf serverless function
  outputFileTracingIncludes: {
    '/api/export-pdf': ['./node_modules/@sparticuz/chromium/bin/**'],
  },
  async headers() {
    return [
      {
        // Allow DataWizard to be embedded in iframes on any domain
        source: '/:path*',
        headers: [
          // Don't set X-Frame-Options at all - let CSP handle it
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;