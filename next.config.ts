import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: true, // Required for Netlify
  },
  // Optimize for Netlify deployment
  trailingSlash: true,
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  
  // Exclude problematic AI dependencies from client bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
      
      // Exclude AI/OpenTelemetry packages from client bundle
      config.externals = config.externals || [];
      config.externals.push({
        '@opentelemetry/sdk-node': 'commonjs @opentelemetry/sdk-node',
        '@opentelemetry/instrumentation': 'commonjs @opentelemetry/instrumentation',
        'genkit': 'commonjs genkit',
        '@genkit-ai/core': 'commonjs @genkit-ai/core',
        '@genkit-ai/googleai': 'commonjs @genkit-ai/googleai',
      });
    }
    return config;
  },
};

export default nextConfig;
