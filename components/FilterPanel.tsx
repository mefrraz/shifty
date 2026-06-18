"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export default function FilterPanel({ brands }: { brands: string[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const curBrand = sp.get("marca") || "";
  const curSort = sp.get("ordem") || "newest";
  const curSale = sp.get("promocao") === "1";
  const curQuery = sp.get("q") || "";

  const update = useCallback((upd: Record<string, string | null>) => {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(upd)) { if (v === null || v === "") p.delete(k); else p.set(k, v); }
    router.push(`/catalogo?${p}`);
  }, [router, sp]);

  const sorts = [{ v: "newest", l: "Novidades" }, { v: "discount", l: "Maior desconto" }, { v: "price_asc", l: "Preço ↑" }, { v: "price_desc", l: "Preço ↓" }];

  return (
    <aside className="w-full lg:w-56 shrink-0">
      <div className="flex flex-col gap-5 lg:sticky lg:top-[70px]">
        {curQuery && (
          <div className="text-sm">
            <span className="text-[#6B7280]">Pesquisa: </span>
            <span className="font-semibold">"{curQuery}"</span>
            <button onClick={() => update({ q: null })} className="ml-2 text-[#F97316] text-xs font-bold">limpar</button>
          </div>
        )}

        <div>
          <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.08em] mb-2">Ordenar</div>
          <div className="flex flex-wrap gap-1.5">
            {sorts.map(s => (
              <button key={s.v} onClick={() => update({ ordem: s.v })}
                className={`px-3 py-1.5 rounded-[20px] text-[13px] font-medium border transition-colors ${curSort === s.v ? "bg-[#F97316] border-[#F97316] text-white font-bold" : "border-[#E5E7EB] text-[#374151] bg-white hover:bg-[#F3F4F6]"}`}>
                {s.l}
              </button>
            ))}
          </div>
        </div>

        {brands.length > 0 && (
          <div>
            <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.08em] mb-2">Marca</div>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
              <button onClick={() => update({ marca: null })}
                className={`px-3 py-1.5 rounded-[20px] text-[13px] font-medium border transition-colors ${!curBrand ? "bg-[#F97316] border-[#F97316] text-white font-bold" : "border-[#E5E7EB] text-[#374151] bg-white hover:bg-[#F3F4F6]"}`}>Todas</button>
              {brands.map(b => (
                <button key={b} onClick={() => update({ marca: b })}
                  className={`px-3 py-1.5 rounded-[20px] text-[13px] font-medium border transition-colors ${curBrand === b ? "bg-[#F97316] border-[#F97316] text-white font-bold" : "border-[#E5E7EB] text-[#374151] bg-white hover:bg-[#F3F4F6]"}`}>{b}</button>
              ))}
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={curSale} onChange={e => update({ promocao: e.target.checked ? "1" : null })}
            className="h-4 w-4 rounded border-[#D1D5DB] text-[#F97316] focus:ring-[#F97316]" />
          <span className="text-[13px] font-medium text-[#374151]">Em promoção</span>
        </label>

        {(curBrand || curSale) && (
          <button onClick={() => router.push("/catalogo")} className="text-sm font-semibold text-[#F97316]">Limpar filtros</button>
        )}
      </div>
    </aside>
  );
}
