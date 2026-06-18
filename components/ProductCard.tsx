import Link from "next/link";

interface ProductCardProps {
  slug: string; name: string; brand: string;
  imageUrl?: string | null; image_url?: string | null;
  minPrice?: number; min_price?: number;
  maxPrice?: number; max_price?: number;
  savingsPct?: number; savings_pct?: number;
  storeCount?: number; store_count?: number;
  id?: string;
}

export default function ProductCard(props: ProductCardProps) {
  const { slug, name, brand } = props;
  const imageUrl = props.imageUrl ?? props.image_url ?? null;
  const minPrice = props.minPrice ?? props.min_price ?? 0;
  const maxPrice = props.maxPrice ?? props.max_price ?? 0;
  const savingsPct = props.savingsPct ?? props.savings_pct ?? 0;
  const storeCount = props.storeCount ?? props.store_count ?? 0;
  const hasDiscount = savingsPct > 0;

  const fmt = (v: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(v);

  return (
    <Link href={`/sapatilha/${slug}`} className="group block bg-white rounded-[14px] overflow-hidden border border-[#E5E7EB] hover:shadow-sm transition-shadow">
      {/* Imagem */}
      <div className="relative h-[140px] bg-[#F3F4F6] flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="h-full w-full object-contain p-3 group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <span className="text-sm text-[#6B7280]">📷</span>
        )}
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-[#F97316] text-white text-[10px] font-extrabold px-2 py-1 rounded-md tracking-[0.03em]">
            {Math.round(savingsPct)}%
          </span>
        )}
        <span className="absolute top-2 right-2 bg-[#16A34A] text-white text-[10px] font-bold px-2 py-1 rounded-md">
          Stock
        </span>
      </div>
      {/* Body */}
      <div className="p-3">
        <div className="text-[10px] font-extrabold text-[#F97316] uppercase tracking-[0.06em] mb-0.5">
          {brand}
        </div>
        <div className="text-[13px] font-bold text-[#111827] leading-[1.3] line-clamp-2 mb-2">
          {name}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-black text-[#111827] tracking-[-0.5px]">
            {fmt(minPrice)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-[#D1D5DB] line-through">{fmt(maxPrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
