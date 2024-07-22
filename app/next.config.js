/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  semi: false,
  output: "export",
  singleQuote: true,
  basePath: "/Charity-pool",
  trailingComma: "all",
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
