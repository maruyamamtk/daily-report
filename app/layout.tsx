/**
 * Root Layout
 *
 * Top-level layout for the entire application.
 * Provides HTML structure, metadata, and global styles.
 */

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "営業日報システム",
    template: "%s | 営業日報システム",
  },
  description: "営業活動の日報管理システム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
