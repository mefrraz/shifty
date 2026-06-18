import SearchBar from "@/components/SearchBar";
import ProductCard from "@/components/ProductCard";
import { getProducts, getPopularBrands } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Busca dados em paralelo
  const [bestDeals, newestProducts, popularBrands] = await Promise.all([
    getProducts({ sort: "discount", limit: 6, onSale: true }),
    getProducts({ sort: "newest", limit: 6 }),
    getPopularBrands(),
  ]);

  const brandLogos: Record<string, string> = {
    Nike: "N",
    Jordan: "J",
    Adidas: "A",
    Puma: "P",
    "Under Armour": "UA",
    "New Balance": "NB",
    Reebok: "R",
    Anta: "AN",
    "Li-Ning": "LN",
  };

  return (
    <div>
      {/* Hero — barra de pesquisa central */}
      <section className="bg-gradient-to-b from-orange-50 to-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl lg:text-6xl">
            Sapatilhas de{" "}
            <span className="text-orange-500">basquetebol</span>
          </h1>
          <p className="mt-4 text-lg text-gray-500 sm:text-xl max-w-2xl mx-auto">
            Compara preços nas melhores lojas ibéricas. Encontra o par perfeito
            para o teu jogo.
          </p>
          <div className="mt-8">
            <SearchBar large />
          </div>
        </div>
      </section>

      {/* Melhores Descontos Hoje */}
      {bestDeals.products.length > 0 && (
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Melhores descontos hoje
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  As maiores poupanças neste momento
                </p>
              </div>
              <a
                href="/catalogo?sort=discount"
                className="text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors"
              >
                Ver todos →
              </a>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {bestDeals.products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Novidades */}
      {newestProducts.products.length > 0 && (
        <section className="py-12 sm:py-16 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Novidades
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Últimas sapatilhas adicionadas
                </p>
              </div>
              <a
                href="/catalogo?sort=newest"
                className="text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors"
              >
                Ver todas →
              </a>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {newestProducts.products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Grid de Marcas */}
      {popularBrands.length > 0 && (
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Marcas
            </h2>
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-8">
              {popularBrands.map((brand) => (
                <a
                  key={brand}
                  href={`/marca/${brand.toLowerCase().replace(/\s+/g, "-")}`}
                  className="flex flex-col items-center gap-3 rounded-xl border border-gray-100 bg-white p-6 hover:border-orange-200 hover:shadow-md transition-all group"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-lg font-bold text-orange-500 group-hover:bg-orange-100 transition-colors">
                    {brandLogos[brand] || brand.charAt(0)}
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {brand}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty state — sem dados */}
      {bestDeals.products.length === 0 && newestProducts.products.length === 0 && (
        <section className="py-24 text-center">
          <div className="mx-auto max-w-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
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
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Ainda sem sapatilhas
            </h2>
            <p className="text-gray-500 mb-6">
              Os scrapers estão a correr. Assim que os primeiros produtos
              chegarem à base de dados, aparecem aqui.
            </p>
            <a
              href="/catalogo"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white hover:bg-orange-600 transition-colors"
            >
              Ver catálogo
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
