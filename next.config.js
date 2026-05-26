const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ENABLE_PWA !== "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = withPWA(nextConfig);
