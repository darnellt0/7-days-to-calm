/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async headers() {
    // Production headers come from em-frontend/vercel.json (microphone=*).
    // Keep local dev identical so the ElevenLabs widget's mic access behaves
    // the same in both environments — an origin-scoped value broke it before.
    return [
      {
        source: "/:path*",
        headers: [{ key: "Permissions-Policy", value: "microphone=*" }],
      },
    ];
  },
};

module.exports = nextConfig;
