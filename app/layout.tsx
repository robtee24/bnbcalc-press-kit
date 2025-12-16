import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BNBCalc Press Kit",
  description: "BNBCalc Press Kit - Press releases, city data, and media resources",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

