import { MARKETING_REDIRECTS } from "./src/lib/marketing/redirects.js";
/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return MARKETING_REDIRECTS.map(([source, destination]) => ({
      source,
      destination,
      statusCode: 301,
    }));
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
