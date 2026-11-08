/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'Permissions-Policy', value: 'microphone=(self), camera=(), geolocation=()' },
    ] }];
  },
};
