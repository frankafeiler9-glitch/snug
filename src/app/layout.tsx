import type { Metadata, Viewport } from "next";
import "./globals.css";

// Root layout: wraps every page in the app.
export const metadata: Metadata = {
  title: "Snug",
  description: "One shared space for the two of you.",
  // Makes the app look native when added to an iPhone home screen.
  appleWebApp: { capable: true, title: "Snug", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // lets us use the full screen on phones with a notch
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdf8f6" },
    { media: "(prefers-color-scheme: dark)", color: "#171214" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
