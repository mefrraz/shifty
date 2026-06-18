import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PriceDisplay from "@/components/PriceDisplay";
import StoreBottomSheet from "@/components/StoreBottomSheet";
import SizeGrid from "@/components/SizeGrid";
import ProductCard from "@/components/ProductCard";
import { getProductBySlug, getRelatedProducts } from "@/lib/data";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Sapatilha não encontrada" };

  return {
    title: `${product.name} — ${product.brand}`,
    description: `Compra ${product.name} da ${product.brand} ao melhor preço. Compara preços em ${(product.prices ?? []).length} lojas ibéricas.`,
    openGraph: {
      title: `${product.name} — ${product.brand} | Shifty`,
      images: product.image_url ? [{ url: product.image_url }] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const relatedProducts = await getRelatedProducts(slug, product.brand, 4);
  const summary = product.summary;

  // Prepara ofertas
  const offers = (product.prices ?? []).map(
    (p: { store: string; store_url: string; current_price: number; original_price: number | null }) => ({
      store: p.store,
      storeName: p.store,
      storeUrl: p.store_url,
      price: p.current_price,
      originalPrice: p.original_price,
      isBestPrice: false,
    })
  );

  // Marca o melhor preço
  if (offers.length > 0) {
    const minPrice = Math.min(...offers.map((o: { price: number }) => o.price));
    offers.forEach((o: { isBestPrice: boolean; price: number }) => {
      o.isBestPrice = o.price === minPrice;
    });
  }

  // Marca normalizada para URL
  const brandSlug = product.brand.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-xs text-gray-400 dark:text-gray-500">
        <a href="/" className="hover:text-orange-500 transition-colors">Início</a>
        <span className="mx-1.5">/</span>
        <a href="/catalogo" className="hover:text-orange-500 transition-colors">Catálogo</a>
        <span className="mx-1.5">/</span>
        <a href={`/marca/${brandSlug}`} className="hover:text-orange-500 transition-colors">{product.brand}</a>
        <span className="mx-1.5">/</span>
        <span className="text-gray-600 dark:text-gray-300 truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10">
        {/* Coluna da esquerda — Imagem */}
        <div className="lg:col-span-3">
          <div className="relative aspect-square bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-contain p-6 sm:p-10"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-200 dark:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
            )}
            {offers.length > 0 && (
              <span className="absolute top-4 left-4 rounded-full bg-green-100 dark:bg-green-900 px-3 py-1 text-xs font-bold text-green-700 dark:text-green-300">
                Em stock
              </span>
            )}
          </div>
        </div>

        {/* Coluna da direita — Info + Compra */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Marca */}
          <a
            href={`/marca/${brandSlug}`}
            className="text-xs font-semibold text-orange-500 uppercase tracking-wider hover:text-orange-600"
          >
            {product.brand}
          </a>

          {/* Nome */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
            {product.name}
          </h1>

          {/* Colorway & Model */}
          {product.colorway && (
            <p className="text-sm text-gray-500 dark:text-gray-400 -mt-3">
              {product.colorway}
            </p>
          )}

          {/* Preço */}
          {summary && (
            <PriceDisplay
              maxPrice={summary.max_price}
              minPrice={summary.min_price}
              savingsPct={summary.savings_pct}
              lastUpdated={summary.last_updated}
            />
          )}

          {/* Botão comprar */}
          <StoreBottomSheet offers={offers} productName={product.name} />

          {/* Descrição */}
          {product.description ? (
            <div className="pt-2">
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                Descrição
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {product.description}
              </p>
            </div>
          ) : (
            <div className="pt-2">
              <p className="text-sm text-gray-400 dark:text-gray-600 italic">
                Descrição em breve — a nossa IA está a processar os detalhes técnicos desta sapatilha.
              </p>
            </div>
          )}

          {/* Tamanhos */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="pt-1">
              <SizeGrid sizes={product.sizes} />
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {product.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:text-gray-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Nota: atualização */}
          {summary?.last_updated && (
            <p className="text-[11px] text-gray-400 dark:text-gray-600 pt-2 border-t border-gray-100 dark:border-gray-800">
              Preços atualizados às{" "}
              {new Date(summary.last_updated).toLocaleTimeString("pt-PT", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" · "}
              {new Date(summary.last_updated).toLocaleDateString("pt-PT")}
            </p>
          )}
        </div>
      </div>

      {/* Relacionados */}
      {relatedProducts.length > 0 && (
        <section className="mt-14">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
            Mais {product.brand}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
