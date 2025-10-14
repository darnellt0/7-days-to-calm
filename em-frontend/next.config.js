/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            // Allow microphone access for the page and ElevenLabs widget
            key: 'Permissions-Policy',
            value: 'microphone=*',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
