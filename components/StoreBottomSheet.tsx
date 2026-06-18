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
  productName?: string;
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

export default function StoreBottomSheet({ offers, productName }: StoreBottomSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sorted = [...offers].sort((a, b) => a.price - b.price);
  const bestPrice = sorted[0]?.price ?? Infinity;
  const storeCount = sorted.length;

  const format = (v: number) =>
    new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(v);

  if (storeCount === 0) return null;

  return (
    <>
      {/* Botão principal */}
      <button
        onClick={() => setIsOpen(true)}
        className="group w-full rounded-xl bg-orange-500 px-6 py-4 text-left hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200 dark:shadow-orange-950"
      >
        <span className="block text-xs text-orange-100 uppercase tracking-wider font-medium">
          {storeCount} {storeCount === 1 ? "loja disponível" : "lojas disponíveis"}
        </span>
        <span className="flex items-baseline gap-2 mt-0.5">
          <span className="text-xl font-bold text-white">
            Desde {format(bestPrice)}
          </span>
          <span className="text-orange-200 text-sm group-hover:translate-x-0.5 transition-transform">
            →
          </span>
        </span>
      </button>

      {/* Overlay + Sheet */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl sm:rounded-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Onde comprar{productName ? ` — ${productName}` : ""}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {storeCount} {storeCount === 1 ? "loja" : "lojas"} com stock
            </p>

            <div className="flex flex-col gap-2">
              {sorted.map((offer) => (
                <a
                  key={offer.store}
                  href={offer.storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 p-4 hover:border-orange-200 dark:hover:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950 transition-all"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {STORE_NAMES[offer.store] || offer.storeName}
                      </span>
                      {offer.price === bestPrice && (
                        <span className="rounded-full bg-orange-100 dark:bg-orange-900 px-2 py-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-400">
                          MELHOR PREÇO
                        </span>
                      )}
                    </div>
                    {offer.originalPrice &&
                      offer.originalPrice > offer.price && (
                        <span className="text-xs text-gray-400 dark:text-gray-600 line-through">
                          {format(offer.originalPrice)}
                        </span>
                      )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {format(offer.price)}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
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

            <button
              onClick={() => setIsOpen(false)}
              className="mt-4 w-full rounded-xl border border-gray-200 dark:border-gray-700 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
