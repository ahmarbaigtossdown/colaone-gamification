import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cola One — Fizz Mode",
  description: "One spin. Be the one. Unlock an instant Cola One reward.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
