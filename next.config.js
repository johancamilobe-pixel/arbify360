/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "goewgztilkclwsdylumg.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

module.exports = nextConfig;