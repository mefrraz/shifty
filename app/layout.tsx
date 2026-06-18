import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavSearch from "@/components/NavSearch";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Shifty — Sapatilhas de Basquetebol ao Melhor Preço", template: "%s | Shifty" },
  description: "Compara preços de sapatilhas de basquetebol nas melhores lojas ibéricas.",
  openGraph: { title: "Shifty — Sapatilhas de Basquetebol ao Melhor Preço", description: "Compara preços nas lojas ibéricas.", siteName: "Shifty", locale: "pt_PT", type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F9FAFB] text-[#111827]">
        {/* Navbar — 56px, branca, com search integrado */}
        <header className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB]">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
            <a href="/" className="text-xl font-black text-[#F97316] tracking-[-1px] shrink-0">shifty</a>
            <nav className="hidden sm:flex items-center gap-5 text-sm font-medium">
              <a href="/catalogo" className="text-[#F97316] font-bold">Catálogo</a>
              <a href="/conta" className="text-[#374151] hover:text-[#F97316] transition-colors">Conta</a>
            </nav>
            <div className="flex-1 max-w-md ml-auto">
              <NavSearch />
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        {/* Footer rico */}
        <footer className="bg-[#111827] text-[#9CA3AF] mt-16">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div>
                <a href="/" className="text-xl font-black text-white tracking-[-1px]">shifty<span className="text-[#F97316]">.pt</span></a>
                <p className="mt-3 text-sm leading-relaxed">O agregador inteligente de sapatilhas de basquetebol. Comparamos preços nas melhores lojas ibéricas.</p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-[0.1em] mb-4">Navegar</h4>
                <div className="flex flex-col gap-2 text-sm">
                  <a href="/catalogo" className="hover:text-white transition-colors">Catálogo</a>
                  <a href="/catalogo?sort=discount" className="hover:text-white transition-colors">Em promoção</a>
                  <a href="/catalogo?sort=newest" className="hover:text-white transition-colors">Novidades</a>
                  <a href="/conta" className="hover:text-white transition-colors">A minha conta</a>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-[0.1em] mb-4">Lojas</h4>
                <div className="flex flex-col gap-2 text-sm">
                  <span>Manel Sanchez</span>
                  <span>Basketball Emotion</span>
                  <span className="text-[#6B7280] text-xs">+ mais em breve</span>
                </div>
              </div>
            </div>
            <div className="mt-10 pt-6 border-t border-[#1F2937] text-center text-xs">
              &copy; {new Date().getFullYear()} Shifty — Todos os direitos reservados.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
