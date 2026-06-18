interface PriceDisplayProps { maxPrice: number; minPrice: number; savingsPct: number; lastUpdated?: string; }

export default function PriceDisplay({ maxPrice, minPrice, savingsPct, lastUpdated }: PriceDisplayProps) {
  const hasDiscount = savingsPct > 0;
  const fmt = (v: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(v);

  return (
    <div className="bg-[#F9FAFB] rounded-[14px] p-4">
      <div className="flex items-baseline gap-2.5 flex-wrap mb-1">
        {hasDiscount && (
          <span className="text-[18px] text-[#D1D5DB] line-through">{fmt(maxPrice)}</span>
        )}
        <span className="text-[34px] font-black text-[#111827] tracking-[-1.5px]">{fmt(minPrice)}</span>
        {hasDiscount && (
          <span className="bg-[#F97316] text-white text-xs font-extrabold px-2.5 py-1.5 rounded-lg self-center">
            Poupa {Math.round(savingsPct)}%
          </span>
        )}
      </div>
      <div className="text-[11px] text-[#6B7280]">
        {lastUpdated
          ? `Atualizado às ${new Date(lastUpdated).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })} · Shifty encontrou o melhor preço`
          : "Shifty encontrou o melhor preço"}
      </div>
    </div>
  );
}
