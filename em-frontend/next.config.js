/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            // let the page use the microphone (unblocks getUserMedia)
            key: 'Permissions-Policy',
            value: 'microphone=(self)',
            // If you prefer to be explicit, you can use:
            // value: 'microphone=(self "https://elevenlabs.io" "https://api.elevenlabs.io")'
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
