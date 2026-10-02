import type { Metadata } from "next";
import { BRAND_ASSETS } from "@/game/data/brand-assets";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Repair Empire", template: "%s | Repair Empire" },
  description: "Baue eine kleine Reparaturwerkstatt zu einem automatisierten Technologieunternehmen aus.",
  icons: {
    icon: [{ url: BRAND_ASSETS.brand.favicon, type: "image/x-icon" }, { url: BRAND_ASSETS.brand.icon16, sizes: "16x16", type: "image/png" }, { url: BRAND_ASSETS.brand.icon32, sizes: "32x32", type: "image/png" }],
    apple: [{ url: BRAND_ASSETS.brand.appleIcon, sizes: "180x180", type: "image/png" }],
    other: [{ rel: "icon", url: BRAND_ASSETS.brand.app192, sizes: "192x192", type: "image/png" }, { rel: "icon", url: BRAND_ASSETS.brand.app512, sizes: "512x512", type: "image/png" }],
  },
  openGraph: {
    title: "Repair Empire",
    description: "Werkstatt-Management mit echter Langzeitprogression.",
    type: "website",
    locale: "de_DE",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}

