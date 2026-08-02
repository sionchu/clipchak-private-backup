import type { MetadataRoute } from "next";
import { platformPages } from "./lib/platforms";
const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://clipchak.kr";
export default function sitemap(): MetadataRoute.Sitemap { return [{ url: base, changeFrequency: "weekly", priority: 1 }, ...platformPages.map((item) => ({ url: `${base}/${item.slug}`, changeFrequency: "weekly" as const, priority: .9 })), { url: `${base}/about`, changeFrequency: "yearly", priority: .3 }, { url: `${base}/privacy`, changeFrequency: "yearly", priority: .2 }, { url: `${base}/terms`, changeFrequency: "yearly", priority: .2 }]; }
