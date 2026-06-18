import SearchBar from "@/components/SearchBar";
import ProductCard from "@/components/ProductCard";
import { getProducts, getPopularBrands } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [bestDeals, newest, popularBrands] = await Promise.all([
    getProducts({ sort: "discount", limit: 6, onSale: true }),
    getProducts({ sort: "newest", limit: 6 }),
    getPopularBrands(),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-white border-b border-[#E5E7EB] py-10 sm:py-14">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h1 className="text-[32px] sm:text-[40px] font-black text-[#111827] tracking-[-1.5px] sm:tracking-[-2px] leading-none">
            Sapatilhas de <span className="text-[#F97316]">basquetebol</span>
          </h1>
          <p className="mt-2 text-[15px] text-[#6B7280]">
            O melhor preço está a um clique de distância.
          </p>
          <div className="mt-6">
            <SearchBar large />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Melhores descontos */}
        {bestDeals.products.length > 0 && (
          <section className="mb-12">
            <div className="flex items-end justify-between mb-5">
              <div>
                <div className="text-[11px] font-bold text-[#F97316] uppercase tracking-[0.12em] mb-1">Ofertas</div>
                <h2 className="text-[22px] font-extrabold text-[#111827] tracking-[-0.5px]">Melhores descontos hoje</h2>
              </div>
              <a href="/catalogo?sort=discount" className="text-sm font-semibold text-[#F97316] hover:text-[#EA580C]">Ver todos →</a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {bestDeals.products.map(p => <ProductCard key={p.id} {...p} />)}
            </div>
          </section>
        )}

        {/* Novidades */}
        {newest.products.length > 0 && (
          <section className="mb-12">
            <div className="flex items-end justify-between mb-5">
              <div>
                <div className="text-[11px] font-bold text-[#F97316] uppercase tracking-[0.12em] mb-1">Recentes</div>
                <h2 className="text-[22px] font-extrabold text-[#111827] tracking-[-0.5px]">Novidades</h2>
              </div>
              <a href="/catalogo?sort=newest" className="text-sm font-semibold text-[#F97316] hover:text-[#EA580C]">Ver todas →</a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {newest.products.map(p => <ProductCard key={p.id} {...p} />)}
            </div>
          </section>
        )}

        {/* Marcas */}
        {popularBrands.length > 0 && (
          <section>
            <div className="text-[11px] font-bold text-[#F97316] uppercase tracking-[0.12em] mb-1">Marcas</div>
            <h2 className="text-[22px] font-extrabold text-[#111827] tracking-[-0.5px] mb-5">Explora por marca</h2>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {popularBrands.map(b => (
                <a key={b} href={`/marca/${b.toLowerCase().replace(/\s+/g, "-")}`}
                  className="flex-shrink-0 bg-white border border-[#E5E7EB] rounded-[20px] px-4 py-2 text-[13px] font-bold text-[#374151] hover:bg-[#FFF7ED] hover:border-[#FED7AA] hover:text-[#EA580C] transition-colors">
                  {b}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {bestDeals.products.length === 0 && newest.products.length === 0 && (
          <section className="py-20 text-center">
            <div className="text-4xl mb-4">👟</div>
            <h2 className="text-xl font-extrabold text-[#111827] mb-2">Ainda sem sapatilhas</h2>
            <p className="text-[#6B7280] text-sm">Os scrapers estão a correr. Assim que os produtos chegarem, aparecem aqui.</p>
          </section>
        )}
      </div>
    </div>
  );
}
