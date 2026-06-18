import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Shifty — Sapatilhas de Basquetebol ao Melhor Preço", template: "%s | Shifty" },
  description: "Compara preços de sapatilhas de basquetebol nas melhores lojas ibéricas.",
  openGraph: { title: "Shifty — Sapatilhas de Basquetebol ao Melhor Preço", description: "Compara preços de sapatilhas de basquetebol nas melhores lojas ibéricas.", siteName: "Shifty", locale: "pt_PT", type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F9FAFB] text-[#111827]">
        {/* Header — 54px, fundo branco */}
        <header className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB]">
          <div className="mx-auto flex h-[54px] max-w-6xl items-center justify-between px-4">
            <a href="/" className="text-xl font-black text-[#F97316] tracking-[-1px]">
              shifty
            </a>
            <nav className="flex items-center gap-5">
              <a href="/catalogo" className="text-sm font-bold text-[#F97316]">Catálogo</a>
              <a href="/conta" className="text-sm font-medium text-[#374151] hover:text-[#F97316] transition-colors">Conta</a>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-[#E5E7EB] bg-white py-6 mt-12">
          <div className="mx-auto max-w-6xl px-4 text-center text-xs text-[#9CA3AF]">
            <a href="/" className="font-black text-[#F97316] text-sm tracking-[-0.5px]">shifty.pt</a>
            <p className="mt-1">&copy; {new Date().getFullYear()} Shifty</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
