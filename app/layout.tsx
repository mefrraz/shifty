import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Shifty — Sapatilhas de Basquetebol ao Melhor Preço",
    template: "%s | Shifty",
  },
  description:
    "Compara preços de sapatilhas de basquetebol nas melhores lojas ibéricas. Encontra o melhor preço em segundos.",
  keywords: [
    "sapatilhas basquetebol",
    "ténis basquetebol",
    "basketball shoes",
    "comparador preços",
    "Nike",
    "Jordan",
    "Adidas",
    "Puma",
    "Portugal",
  ],
  openGraph: {
    title: "Shifty — Sapatilhas de Basquetebol ao Melhor Preço",
    description:
      "Compara preços de sapatilhas de basquetebol nas melhores lojas ibéricas.",
    url: "https://shifty.pt",
    siteName: "Shifty",
    locale: "pt_PT",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <a href="/" className="flex items-center gap-2 font-bold text-xl">
              <span className="text-orange-500">shifty</span>
              <span className="hidden sm:inline text-gray-400 font-normal text-sm">
                .pt
              </span>
            </a>
            <nav className="flex items-center gap-6 text-sm font-medium">
              <a
                href="/catalogo"
                className="text-gray-600 hover:text-orange-500 transition-colors"
              >
                Catálogo
              </a>
              <a
                href="/conta"
                className="text-gray-600 hover:text-orange-500 transition-colors"
              >
                Conta
              </a>
            </nav>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-gray-100 bg-gray-50 py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center gap-4 text-sm text-gray-500">
              <a href="/" className="font-bold text-orange-500 text-lg">
                shifty.pt
              </a>
              <p>O agregador inteligente de sapatilhas de basquetebol.</p>
              <div className="flex gap-6">
                <a href="/catalogo" className="hover:text-orange-500 transition-colors">
                  Catálogo
                </a>
                <a href="/conta" className="hover:text-orange-500 transition-colors">
                  Conta
                </a>
              </div>
              <p className="text-xs">
                &copy; {new Date().getFullYear()} Shifty — Todos os direitos reservados.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
