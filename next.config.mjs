import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com", // Fotos de planillas
      },
      {
        protocol: "https",
        hostname: "img.clerk.com", // Fotos de perfil de Clerk
      },
    ],
  },
};

export default nextConfig;
