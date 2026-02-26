/** @type {import('next').NextConfig} */
const nextConfig = {
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