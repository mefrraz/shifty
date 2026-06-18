interface Sz { store: string; size_eu: string; size_us: string | null; in_stock: boolean; }

export default function SizeGrid({ sizes }: { sizes: Sz[] }) {
  if (!sizes || sizes.length === 0) return <div className="text-xs text-[#9CA3AF]">Tamanhos indisponíveis</div>;

  const map = new Map<string, string[]>();
  for (const s of sizes) { if (!map.has(s.size_eu)) map.set(s.size_eu, []); map.get(s.size_eu)!.push(s.store); }
  const sorted = [...map.keys()].sort((a, b) => parseFloat(a) - parseFloat(b));

  return (
    <div>
      <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.08em] mb-2">Tamanhos disponíveis</div>
      <div className="flex flex-wrap gap-1.5">
        {sorted.map(sz => {
          const stores = map.get(sz)!;
          const hasStock = stores.length > 0;
          return (
            <div key={sz}
              className={`w-12 h-10 flex items-center justify-center rounded-[10px] text-[13px] font-semibold border-[1.5px] ${hasStock ? "border-[#F97316] bg-[#FFF7ED] text-[#EA580C] font-extrabold" : "border-dashed border-[#E5E7EB] bg-[#F9FAFB] text-[#D1D5DB] line-through"}`}
              title={hasStock ? `Disponível em: ${stores.join(", ")}` : "Esgotado"}>
              {sz}
            </div>
          );
        })}
      </div>
    </div>
  );
}
