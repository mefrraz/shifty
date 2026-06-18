import { Suspense } from "react";
import ProductCard from "@/components/ProductCard";
import FilterPanel from "@/components/FilterPanel";
import SearchBar from "@/components/SearchBar";
import { getProducts, getBrands } from "@/lib/data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catálogo de Sapatilhas de Basquetebol",
  description:
    "Explora todas as sapatilhas de basquetebol. Filtra por marca, preço, posição de jogo e mais.",
};

export const dynamic = "force-dynamic";

interface CatalogPageProps {
  searchParams: Promise<{
    marca?: string;
    ordem?: string;
    promocao?: string;
    posicao?: string;
    q?: string;
    pagina?: string;
  }>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;

  const brand = params.marca;
  const sort = (params.ordem as "discount" | "price_asc" | "price_desc" | "newest") || "newest";
  const onSale = params.promocao === "1";
  const playerType = params.posicao;
  const query = params.q;
  const page = parseInt(params.pagina || "1", 10);
  const pageSize = 24;
  const offset = (page - 1) * pageSize;

  const [{ products, count }, brands] = await Promise.all([
    getProducts({
      brand,
      sort,
      onSale,
      playerType,
      query,
      limit: pageSize,
      offset,
    }),
    getBrands(),
  ]);

  const totalPages = Math.ceil(count / pageSize);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Catálogo</h1>
        <p className="mt-1 text-gray-500">
          {count} sapatilha{count !== 1 ? "s" : ""} encontrada
          {count !== 1 ? "s" : ""}
          {query && (
            <span>
              {" "}
              para "<span className="font-medium">{query}</span>"
            </span>
          )}
        </p>
        <div className="mt-4 max-w-md">
          <SearchBar placeholder="Nike LeBron, Jordan, Adidas..." />
        </div>
      </div>

      {/* Layout: filtros + grid */}
      <div className="flex flex-col lg:flex-row gap-8">
        <Suspense fallback={<div className="w-full lg:w-64">Filtros...</div>}>
          <FilterPanel brands={brands} />
        </Suspense>

        {/* Grid de produtos */}
        <div className="flex-1">
          {products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  {page > 1 && (
                    <a
                      href={`/catalogo?${new URLSearchParams({
                        ...params,
                        pagina: String(page - 1),
                      }).toString()}`}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      ← Anterior
                    </a>
                  )}
                  <span className="text-sm text-gray-500">
                    Página {page} de {totalPages}
                  </span>
                  {page < totalPages && (
                    <a
                      href={`/catalogo?${new URLSearchParams({
                        ...params,
                        pagina: String(page + 1),
                      }).toString()}`}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Seguinte →
                    </a>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-orange-400"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Nenhum resultado
              </h2>
              <p className="text-gray-500">
                Tenta outros filtros ou volta mais tarde.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
