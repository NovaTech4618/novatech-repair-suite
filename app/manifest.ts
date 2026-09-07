import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NOVATECH Repair Suite",
    short_name: "NOVATECH",
    description: "Repair-shop management for customers, repairs, inventory, sales and finances.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f7f9f8",
    theme_color: "#0f766e",
    orientation: "portrait-primary",
  };
}
