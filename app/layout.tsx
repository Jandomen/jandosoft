import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Wallpoet } from "next/font/google";
import "./globals.css";
import { verifyEmailConfig } from "@/lib/email-verify";
import { Providers } from "./Providers";

if (process.env.NODE_ENV !== "production") {
  verifyEmailConfig();
}

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const wallpoet = Wallpoet({
  weight: "400",
  variable: "--font-wallpoet",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jandosoft",
  description: "Plataforma de desarrollo y gestión de software de alto impacto. aplicaciones móviles y sitios web premium para empresas de alto nivel.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/favicon.ico" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${wallpoet.variable} antialiased selection:bg-brand/20`}
      >
        <Providers>
          {children}
         
        </Providers>
      </body>
    </html>
  );
}
