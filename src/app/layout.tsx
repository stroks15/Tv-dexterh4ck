import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TV DexterH4ck",
  description: "Tu centro de entretenimiento: canales, películas, series y favoritos.",
  applicationName: "TV DexterH4ck",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { themeColor: "#080b14" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body>{children}</body></html>;
}
