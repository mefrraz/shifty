import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductCard from "@/components/ProductCard";
import { getProducts, getBrands } from "@/lib/data";

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brandName = decodeURIComponent(slug)
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    title: `${brandName} — Sapatilhas de Basquetebol`,
    description: `Explora todas as sapatilhas de basquetebol da ${brandName}. Compara preços nas melhores lojas ibéricas.`,
  };
}

export const dynamic = "force-dynamic";

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const brandSlug = decodeURIComponent(slug);

  // Busca todas as marcas para encontrar o nome correto
  const brands = await getBrands();
  const brand = brands.find(
    (b) => b.toLowerCase().replace(/\s+/g, "-") === brandSlug
  );

  if (!brand) {
    notFound();
  }

  const { products } = await getProducts({ brand, sort: "newest", limit: 48 });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <a href="/catalogo" className="text-sm text-orange-500 hover:text-orange-600 transition-colors">
          ← Catálogo
        </a>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">{brand}</h1>
        <p className="mt-1 text-gray-500">
          {products.length} sapatilha{products.length !== 1 ? "s" : ""} encontrada
          {products.length !== 1 ? "s" : ""}
        </p>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              {...product}
              imageUrl={product.image_url}
            />
          ))}
        </div>
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
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Ainda sem produtos
          </h2>
          <p className="text-gray-500">
            Ainda não temos sapatilhas da {brand} na base de dados.
          </p>
        </div>
      )}
    </div>
  );
}
