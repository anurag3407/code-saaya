import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saaya — AI Repository Knowledge Generator",
  description:
    "Generate comprehensive, enterprise-grade repository documentation and knowledge bases. Powered by multi-agent AI, delivered via GitHub Pull Requests.",
  keywords: ["documentation", "AI", "repository", "knowledge-base", "open-source"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className="noise-overlay antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
