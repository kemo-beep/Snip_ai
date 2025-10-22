import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        // Apply headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ]
  },
  // Disable Turbopack for now to use Webpack (better FFmpeg support)
  experimental: {
    turbo: undefined,
  },
  webpack: (config, { isServer }) => {
    // Ignore node-specific modules in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }
    
    return config
  },
};

export default nextConfig;
