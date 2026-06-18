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

  if (!product) {
    return { title: "Sapatilha não encontrada" };
  }

  return {
    title: `${product.name} — ${product.brand}`,
    description:
      product.description ||
      `Compra ${product.name} da ${product.brand} ao melhor preço. Compara preços em várias lojas ibéricas.`,
    openGraph: {
      title: `${product.name} — ${product.brand} | Shifty`,
      description:
        product.description ||
        `Encontra o melhor preço para ${product.name}.`,
      images: product.image_url ? [{ url: product.image_url }] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(slug, product.brand, 4);

  const summary = product.summary;

  // Prepara ofertas para o StoreBottomSheet
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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-400">
        <a href="/" className="hover:text-orange-500 transition-colors">
          Início
        </a>
        <span className="mx-2">/</span>
        <a
          href={`/marca/${product.brand.toLowerCase().replace(/\s+/g, "-")}`}
          className="hover:text-orange-500 transition-colors"
        >
          {product.brand}
        </a>
        <span className="mx-2">/</span>
        <span className="text-gray-600">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Imagem */}
        <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-contain p-8"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          )}

          {/* Badge de stock */}
          {offers.length > 0 && (
            <span className="absolute top-4 left-4 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
      Em stock
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-6">
          {/* Marca + Nome */}
          <div>
            <a
              href={`/marca/${product.brand.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-sm font-medium text-orange-500 uppercase tracking-wider hover:text-orange-600 transition-colors"
            >
              {product.brand}
            </a>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900">
              {product.name}
            </h1>
            {product.colorway && (
              <p className="mt-1 text-sm text-gray-400">{product.colorway}</p>
            )}
          </div>

          {/* Preço */}
          {summary && (
            <PriceDisplay
              maxPrice={summary.max_price}
              minPrice={summary.min_price}
              savingsPct={summary.savings_pct}
              lastUpdated={summary.last_updated}
            />
          )}

          {/* Botão comprar → Bottom sheet */}
          {offers.length > 0 && <StoreBottomSheet offers={offers} />}

          {/* Descrição */}
          {product.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Descrição
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Tamanhos */}
          {product.sizes && product.sizes.length > 0 && (
            <SizeGrid sizes={product.sizes} />
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Produtos relacionados */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Mais de {product.brand}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
