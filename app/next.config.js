/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  semi: false,
  singleQuote: true,
  trailingComma: "all",
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
