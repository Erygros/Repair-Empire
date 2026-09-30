import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Repair Empire",
  description: "Build your electronics repair workshop.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}

