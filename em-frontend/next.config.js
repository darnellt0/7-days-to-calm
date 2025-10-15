/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async headers() {
    // NOTE: Permissions-Policy must list explicit origins (quotes required).
    const devOrigins = `"http://localhost:3000" "http://127.0.0.1:3000"`;
    const prodOrigins = `"https://7-days-to-calm.vercel.app" "https://elevatedmovements.com" "https://www.elevatedmovements.com"`;
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Permissions-Policy", value: `microphone=(self ${devOrigins} ${prodOrigins})` },
          // If you need autoplay too, add another header:
          // { key: "Permissions-Policy", value: `autoplay=(self ${devOrigins} ${prodOrigins})` },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
