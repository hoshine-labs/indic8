import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow ngrok tunnels and external hosts
  allowedDevOrigins: [
    "localhost:3000",
    "*.ngrok-free.dev",
    "*.ngrok.io",
    "latoyia-bicapsular-gainly.ngrok-free.dev",
  ],
};

export default nextConfig;