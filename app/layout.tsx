import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Oooii Oooii - Daily Motivational Book",
  description: "Manjula Upashantha - motivational writings and images, newest first, unread tracking, lifetime access.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
