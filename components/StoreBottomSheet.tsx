"use client";
import { useState } from "react";

interface StoreOffer { store: string; storeName: string; storeUrl: string; price: number; originalPrice?: number | null; isBestPrice: boolean; }

const NAMES: Record<string, string> = { manelsanchez: "Manel Sanchez", basket4ballers: "Basket4Ballers", basketballemotion: "Basketball Emotion", nike: "Nike PT" };

export default function StoreBottomSheet({ offers }: { offers: StoreOffer[] }) {
  const [open, setOpen] = useState(false);
  const sorted = [...offers].sort((a, b) => a.price - b.price);
  const best = sorted[0]?.price ?? Infinity;
  const fmt = (v: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(v);
  if (sorted.length === 0) return null;

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="w-full bg-[#F97316] text-white rounded-xl py-[15px] px-6 text-base font-extrabold tracking-[-0.2px] hover:bg-[#EA580C] transition-colors">
        Ver {sorted.length} {sorted.length === 1 ? "loja" : "lojas"} e comprar — desde {fmt(best)}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md bg-white rounded-t-[22px] sm:rounded-[22px] px-5 pt-4 pb-5 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-9 h-1 bg-[#E5E7EB] rounded mx-auto mb-4" />
            <h3 className="text-base font-extrabold text-[#111827] mb-3.5 tracking-[-0.3px]">Comprar esta sapatilha</h3>
            {sorted.map(o => (
              <div key={o.store} className={`flex items-center justify-between px-3.5 py-3 rounded-xl mb-2 border ${o.price === best ? "bg-[#FFF7ED] border-[#FED7AA]" : "border-[#E5E7EB]"}`}>
                <div>
                  <div className="text-sm font-bold text-[#111827]">{NAMES[o.store] || o.storeName}</div>
                  {o.price === best && <div className="text-[10px] font-extrabold text-[#EA580C] mt-0.5">🔥 Melhor preço</div>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[17px] font-black tracking-[-0.5px] ${o.price === best ? "text-[#111827]" : "text-[#9CA3AF]"}`}>{fmt(o.price)}</span>
                  <a href={o.storeUrl} target="_blank" rel="noopener noreferrer"
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold ${o.price === best ? "bg-[#F97316] text-white" : "bg-[#F3F4F6] text-[#6B7280]"} hover:opacity-90 transition-opacity`}>
                    Comprar →
                  </a>
                </div>
              </div>
            ))}
            <button onClick={() => setOpen(false)} className="mt-3 w-full py-3 text-sm font-semibold text-[#6B7280] bg-[#F3F4F6] rounded-xl hover:bg-[#E5E7EB] transition-colors">
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
