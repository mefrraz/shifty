import { Suspense } from "react";
import ProductCard from "@/components/ProductCard";
import FilterPanel from "@/components/FilterPanel";
import SearchBar from "@/components/SearchBar";
import { getProducts, getBrands } from "@/lib/data";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Catálogo de Sapatilhas de Basquetebol", description: "Explora todas as sapatilhas de basquetebol. Filtra por marca, preço, posição de jogo e mais." };
export const dynamic = "force-dynamic";

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const p = await searchParams;
  const brand = p.marca; const sort = (p.ordem as any) || "newest"; const onSale = p.promocao === "1";
  const playerType = p.posicao; const query = p.q;
  const page = parseInt(p.pagina || "1"); const ps = 24; const offset = (page - 1) * ps;

  const [{ products, count }, brands] = await Promise.all([getProducts({ brand, sort, onSale, playerType, query, limit: ps, offset }), getBrands()]);
  const totalPages = Math.ceil(count / ps);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-extrabold text-[#111827] tracking-[-0.5px]">Catálogo</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">{count} sapatilha{count !== 1 ? "s" : ""}{query ? <> para "{query}"</> : ""}</p>
        </div>
        <div className="w-64 hidden sm:block"><SearchBar /></div>
      </div>
      <div className="sm:hidden mb-4"><SearchBar /></div>

      <div className="flex flex-col lg:flex-row gap-6">
        <Suspense><FilterPanel brands={brands} /></Suspense>
        <div className="flex-1">
          {products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {products.map(p => <ProductCard key={p.id} {...p} />)}
              </div>
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-3 text-sm font-medium">
                  {page > 1 && <a href={`/catalogo?${new URLSearchParams({ ...p, pagina: String(page - 1) })}`} className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-[#374151] hover:bg-white">← Anterior</a>}
                  <span className="px-4 py-2 text-[#6B7280]">Página {page} de {totalPages}</span>
                  {page < totalPages && <a href={`/catalogo?${new URLSearchParams({ ...p, pagina: String(page + 1) })}`} className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-[#374151] hover:bg-white">Seguinte →</a>}
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h2 className="text-lg font-extrabold text-[#111827] mb-1">Nenhum resultado</h2>
              <p className="text-sm text-[#6B7280]">Tenta outros filtros.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
