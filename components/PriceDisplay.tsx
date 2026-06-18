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
  lastUpdated,
}: PriceDisplayProps) {
  const hasDiscount = savingsPct > 0;
  const format = (v: number) =>
    new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(v);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-3">
        {/* Preço atual (mínimo) */}
        <span className="text-3xl font-bold text-gray-900">
          {format(minPrice)}
        </span>

        {/* Preço original riscado */}
        {hasDiscount && (
          <span className="text-lg text-gray-400 line-through">
            {format(maxPrice)}
          </span>
        )}

        {/* Poupança */}
        {hasDiscount && (
          <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-600">
            Poupa {Math.round(savingsPct)}%
          </span>
        )}
      </div>

      {/* Melhor preço encontrado */}
      {hasDiscount && (
        <p className="text-sm text-gray-500">
          <span className="text-orange-500 font-medium">Shifty</span> encontrou o
          melhor preço — diferença de{" "}
          <span className="font-semibold">{format(maxPrice - minPrice)}</span>
        </p>
      )}

      {/* Última atualização */}
      {lastUpdated && (
        <p className="text-xs text-gray-400">
          Atualizado às{" "}
          {new Date(lastUpdated).toLocaleTimeString("pt-PT", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}
