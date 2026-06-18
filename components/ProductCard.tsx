import Link from "next/link";

interface ProductCardProps {
  slug: string;
  name: string;
  brand: string;
  imageUrl?: string | null;
  image_url?: string | null;
  minPrice?: number;
  min_price?: number;
  maxPrice?: number;
  max_price?: number;
  savingsPct?: number;
  savings_pct?: number;
  storeCount?: number;
  store_count?: number;
  id?: string;
}

export default function ProductCard(props: ProductCardProps) {
  const slug = props.slug;
  const name = props.name;
  const brand = props.brand;
  const imageUrl = props.imageUrl ?? props.image_url ?? null;
  const minPrice = props.minPrice ?? props.min_price ?? 0;
  const maxPrice = props.maxPrice ?? props.max_price ?? 0;
  const savingsPct = props.savingsPct ?? props.savings_pct ?? 0;
  const storeCount = props.storeCount ?? props.store_count ?? 0;
  const hasDiscount = savingsPct > 0;

  return (
    <Link
      href={`/sapatilha/${slug}`}
      className="shifty-card group flex flex-col overflow-hidden"
    >
      {/* Imagem */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
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

        {/* Badge desconto */}
        {hasDiscount && (
          <span className="absolute top-3 right-3 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
            -{Math.round(savingsPct)}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 p-4">
        <span className="text-xs font-medium text-orange-500 uppercase tracking-wider">
          {brand}
        </span>
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
          {name}
        </h3>

        <div className="mt-auto pt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900">
            {new Intl.NumberFormat("pt-PT", {
              style: "currency",
              currency: "EUR",
            }).format(minPrice)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              {new Intl.NumberFormat("pt-PT", {
                style: "currency",
                currency: "EUR",
              }).format(maxPrice)}
            </span>
          )}
        </div>

        <span className="text-xs text-gray-400">
          {storeCount} {storeCount === 1 ? "loja" : "lojas"}
        </span>
      </div>
    </Link>
  );
}
