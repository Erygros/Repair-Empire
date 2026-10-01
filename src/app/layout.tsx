import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Repair Empire", template: "%s | Repair Empire" },
  description: "Baue eine kleine Reparaturwerkstatt zu einem automatisierten Technologieunternehmen aus.",
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

