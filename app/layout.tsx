import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeToggle } from "@/components/ThemeToggle";

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
  openGraph: {
    title: "Shifty — Sapatilhas de Basquetebol ao Melhor Preço",
    description:
      "Compara preços de sapatilhas de basquetebol nas melhores lojas ibéricas.",
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
    <html lang="pt" className={`${inter.className} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}>
        {/* Header compacto */}
        <header className="sticky top-0 z-50 border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="mx-auto flex h-12 items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Logo — quadrado laranja */}
            <a href="/" className="flex items-center gap-3 group" aria-label="Shifty">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white font-black text-sm group-hover:bg-orange-600 transition-colors">
                S
              </span>
            </a>

            {/* Nav */}
            <nav className="flex items-center gap-1 text-sm font-medium">
              <a
                href="/catalogo"
                className="px-3 py-1.5 rounded-lg text-gray-600 hover:text-orange-500 hover:bg-orange-50 dark:text-gray-400 dark:hover:text-orange-400 dark:hover:bg-orange-950 transition-colors"
              >
                Catálogo
              </a>
              <ThemeToggle />
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        {/* Footer minimal */}
        <footer className="border-t py-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-alt)' }}>
          <div className="mx-auto max-w-7xl px-4 text-center text-xs text-gray-400">
            <a href="/" className="inline-flex items-center gap-2 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-orange-500 text-white font-black text-[10px]">
                S
              </span>
              <span className="font-bold text-gray-500">shifty.pt</span>
            </a>
            <p>&copy; {new Date().getFullYear()} Shifty</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
