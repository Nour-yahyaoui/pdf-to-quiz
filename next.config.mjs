/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pdf-parse must stay external so its CommonJS internals (pdfjs-dist) are
  // not bundled by the Server compiler. The route forces the Node.js runtime.
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
