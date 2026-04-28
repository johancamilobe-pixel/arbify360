import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
//import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ArbiFy360",
    template: "%s · ArbiFy360",
  },
  description: "Plataforma de gestión integral para árbitros deportivos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className="antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}