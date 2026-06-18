"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface FilterPanelProps {
  brands: string[];
}

export default function FilterPanel({ brands }: FilterPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentBrand = searchParams.get("marca") || "";
  const currentSort = searchParams.get("ordem") || "newest";
  const currentSale = searchParams.get("promocao") === "1";
  const currentPlayerType = searchParams.get("posicao") || "";
  const currentQuery = searchParams.get("q") || "";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      router.push(`/catalogo?${params.toString()}`);
    },
    [router, searchParams]
  );

  const sortOptions = [
    { value: "newest", label: "Novidades" },
    { value: "discount", label: "Maior desconto" },
    { value: "price_asc", label: "Preço ↑" },
    { value: "price_desc", label: "Preço ↓" },
  ];

  const playerTypes = [
    { value: "", label: "Todas" },
    { value: "guard", label: "Base / Guard" },
    { value: "forward", label: "Extremo / Forward" },
    { value: "center", label: "Poste / Center" },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="sticky top-20 space-y-6">
        {/* Pesquisa */}
        {currentQuery && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Pesquisa:</span>
            <span className="font-medium text-gray-900">"{currentQuery}"</span>
            <button
              onClick={() => updateParams({ q: null })}
              className="text-orange-500 hover:text-orange-600 text-xs"
            >
              limpar
            </button>
          </div>
        )}

        {/* Ordenação */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Ordenar
          </h3>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateParams({ ordem: opt.value })}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  currentSort === opt.value
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Marca */}
        {brands.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Marca
            </h3>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              <button
                onClick={() => updateParams({ marca: null })}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  !currentBrand
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Todas
              </button>
              {brands.map((brand) => (
                <button
                  key={brand}
                  onClick={() => updateParams({ marca: brand })}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    currentBrand === brand
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Posição de jogo */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Posição de jogo
          </h3>
          <div className="flex flex-wrap gap-2">
            {playerTypes.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateParams({ posicao: opt.value || null })}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  currentPlayerType === opt.value
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Em promoção */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={currentSale}
              onChange={(e) =>
                updateParams({ promocao: e.target.checked ? "1" : null })
              }
              className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Em promoção
            </span>
          </label>
        </div>

        {/* Limpar filtros */}
        {(currentBrand || currentSale || currentPlayerType) && (
          <button
            onClick={() => router.push("/catalogo")}
            className="text-sm text-orange-500 hover:text-orange-600 font-medium"
          >
            Limpar todos os filtros
          </button>
        )}
      </div>
    </aside>
  );
}
