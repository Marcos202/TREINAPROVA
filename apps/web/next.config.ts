import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@treina-prova/ui", "react-native-css-interop"],
  // Aumenta o limite para Server Actions que recebem imagens em base64 (Super Importador de IA)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "react-native$": "react-native-web",
    };
    config.resolve.extensions = [
      ".web.js",
      ".web.jsx",
      ".web.ts",
      ".web.tsx",
      ...config.resolve.extensions,
    ];
    return config;
  },
};

export default nextConfig;
