"use client";

import { useState } from "react";

interface StoreOffer {
  store: string;
  storeName: string;
  storeUrl: string;
  price: number;
  originalPrice?: number | null;
  isBestPrice: boolean;
}

interface StoreBottomSheetProps {
  offers: StoreOffer[];
}

const STORE_NAMES: Record<string, string> = {
  manelsanchez: "Manel Sanchez",
  basket4ballers: "Basket4Ballers",
  basketballemotion: "Basketball Emotion",
  nike: "Nike PT",
  basketcountry: "BasketCountry",
  basketstore: "BasketStore",
  planetabasket: "Planeta Basket",
};

export default function StoreBottomSheet({ offers }: StoreBottomSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Ordena: melhor preço primeiro
  const sorted = [...offers].sort((a, b) => a.price - b.price);
  const bestPrice = sorted[0]?.price ?? Infinity;

  const format = (v: number) =>
    new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(v);

  return (
    <>
      {/* Botão */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full rounded-xl bg-orange-500 px-6 py-4 text-lg font-bold text-white hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
      >
        Comprar — desde {format(bestPrice)}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
          onClick={() => setIsOpen(false)}
        >
          {/* Sheet */}
          <div
            className="w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-200" />

            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Onde comprar
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {sorted.length} {sorted.length === 1 ? "loja" : "lojas"} com stock
            </p>

            {/* Lista de lojas */}
            <div className="flex flex-col gap-3">
              {sorted.map((offer, i) => (
                <a
                  key={offer.store}
                  href={offer.storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-gray-100 p-4 hover:border-orange-200 hover:bg-orange-50 transition-all"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {STORE_NAMES[offer.store] || offer.storeName}
                      </span>
                      {offer.price === bestPrice && (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                          MELHOR PREÇO
                        </span>
                      )}
                    </div>
                    {offer.originalPrice &&
                      offer.originalPrice > offer.price && (
                        <span className="text-xs text-gray-400 line-through">
                          {format(offer.originalPrice)}
                        </span>
                      )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">
                      {format(offer.price)}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-gray-400"
                    >
                      <path d="M7 17l9.2-9.2M17 17V7H7" />
                    </svg>
                  </div>
                </a>
              ))}
            </div>

            {/* Fechar */}
            <button
              onClick={() => setIsOpen(false)}
              className="mt-4 w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
