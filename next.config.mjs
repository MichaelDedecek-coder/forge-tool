/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          // Tohle zachytí kohokoliv, kdo přijde na ailab-cl.cz
          source: '/:path*',
          has: [{ type: 'host', value: 'ailab-cl.cz' }],
          destination: '/lab/:path*', // A neviditelně mu to podstrčí složku Labu
        },
        {
          // To samé pro lidi, co napíšou www.ailab-cl.cz
          source: '/:path*',
          has: [{ type: 'host', value: 'www.ailab-cl.cz' }],
          destination: '/lab/:path*',
        }
      ]
    };
  },
};

export default nextConfig;