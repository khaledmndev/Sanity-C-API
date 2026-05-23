import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";

import { SanityLive } from "@/sanity/lib/live";

export const metadata: Metadata = {
  title: "Next.js + Sanity",
  description: "Production-ready Sanity integration for App Router",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const { isEnabled: isDraftMode } = await draftMode();

  return (
    <html lang="en">
      <body>
        {children}
        <SanityLive />
        {isDraftMode ? <VisualEditing /> : null}
      </body>
    </html>
  );
}
