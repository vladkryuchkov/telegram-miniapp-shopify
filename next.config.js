/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" }, // allow in Telegram WebView
        ],
      },
    ];
  },
};
module.exports = nextConfig;
