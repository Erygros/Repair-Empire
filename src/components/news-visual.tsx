import Image from "next/image";
import type { NewsItem } from "@/content/news";

const campus = { src: "/images/website-campus.webp", alt: "Repair-Empire-Campus mit Werkstatt, Forschung und Lager" };
const assetVisuals: Record<string, typeof campus> = { "map.campus.prototype": campus };
const categoryVisuals: Record<string, typeof campus> = {
  Development: campus,
  Prototype: { src: "/images/website-workshop.webp", alt: "Techniker arbeiten an Smartphone, Konsole und Laptop" },
  Milestone: { src: "/images/website-expanded.webp", alt: "Ausgebaute Repair-Empire-Werkstatt mit mehreren Arbeitsplätzen" },
};

export function NewsVisual({ item, eager = false, sizes = "(max-width: 640px) 100vw, (max-width: 1149px) 50vw, 440px" }: { item: NewsItem; eager?: boolean; sizes?: string }) {
  const visual = (item.imageAssetId && assetVisuals[item.imageAssetId]) || categoryVisuals[item.category] || { src: "/images/website-research.webp", alt: "Repair-Empire-Forschungslabor mit Messgeräten und Elektronik" };
  return <Image src={visual.src} alt={visual.alt} fill sizes={sizes} loading={eager ? "eager" : "lazy"}/>;
}

export function NewsMeta({ item }: { item: NewsItem }) {
  const date = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(item.publishedAt));
  return <div className="news-meta"><span className={`news-category category-${item.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>{item.category}</span><time dateTime={item.publishedAt}>{date}</time></div>;
}
