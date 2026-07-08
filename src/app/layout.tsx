/** @jsxImportSource react */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Basic AI Agent",
  description: "A basic AI agent built with Vercel AI SDK and Chat SDK",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
          background: "#0a0a0a",
          color: "#f4f4f5",
        }}
      >
        {children}
      </body>
    </html>
  );
}