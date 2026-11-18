import type { NextConfig } from "next";

// Allow only this deployment's public product-image bucket.
const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const storageOrigin = storageUrl ? new URL(storageUrl) : null;
const nextConfig: NextConfig = {
  images: {
    remotePatterns: storageOrigin?.protocol === "https:" ? [{
      protocol: "https",
      hostname: storageOrigin.hostname,
      port: storageOrigin.port,
      pathname: "/storage/v1/object/public/product-images/**",
      search: "",
    }] : [],
  },
};

export default nextConfig;
