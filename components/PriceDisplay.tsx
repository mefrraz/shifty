interface PriceDisplayProps {
  maxPrice: number;
  minPrice: number;
  savingsPct: number;
  lastUpdated?: string;
}

export default function PriceDisplay({
  maxPrice,
  minPrice,
  savingsPct,
}: PriceDisplayProps) {
  const hasDiscount = savingsPct > 0;
  const format = (v: number) =>
    new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(v);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">
          {format(minPrice)}
        </span>
        {hasDiscount && (
          <>
            <span className="text-lg text-gray-400 dark:text-gray-600 line-through">
              {format(maxPrice)}
            </span>
            <span className="rounded-full bg-orange-100 dark:bg-orange-900 px-3 py-1 text-sm font-bold text-orange-600 dark:text-orange-400">
              -{Math.round(savingsPct)}%
            </span>
          </>
        )}
      </div>
      {hasDiscount && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Poupa{" "}
          <span className="font-semibold text-orange-500">
            {format(maxPrice - minPrice)}
          </span>{" "}
          em relação ao preço mais alto encontrado
        </p>
      )}
    </div>
  );
}
