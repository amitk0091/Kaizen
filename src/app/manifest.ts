import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kaizen — Personal Growth OS",
    short_name: "Kaizen",
    description: "Think clearly. Grow daily. Todos, goals, diary, learnings and an AI reflection coach.",
    start_url: "/app",
    display: "standalone",
    background_color: "#0e1512",
    theme_color: "#128a63",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
