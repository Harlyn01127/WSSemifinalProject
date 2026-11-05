import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Partsy — Good parts. Great builds.",
  description:
    "Buy and sell computer parts with the PC-building community. Find your next upgrade on Partsy.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
