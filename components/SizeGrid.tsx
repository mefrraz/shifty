interface SizeAvailability {
  store: string;
  size_eu: string;
  size_us: string | null;
  in_stock: boolean;
}

interface SizeGridProps {
  sizes: SizeAvailability[];
}

export default function SizeGrid({ sizes }: SizeGridProps) {
  if (sizes.length === 0) {
    return (
      <div className="text-sm text-gray-400">
        Tamanhos não disponíveis para esta sapatilha.
      </div>
    );
  }

  // Agrupa por tamanho EU único
  const sizeMap = new Map<string, string[]>();
  for (const s of sizes) {
    if (!sizeMap.has(s.size_eu)) {
      sizeMap.set(s.size_eu, []);
    }
    sizeMap.get(s.size_eu)!.push(s.store);
  }

  // Ordena tamanhos
  const sortedSizes = [...sizeMap.keys()].sort(
    (a, b) => parseFloat(a) - parseFloat(b)
  );

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Tamanhos disponíveis
      </h3>
      <div className="flex flex-wrap gap-2">
        {sortedSizes.map((size) => {
          const stores = sizeMap.get(size)!;
          const allInStock = stores.length > 0;

          return (
            <div
              key={size}
              title={`Disponível em: ${stores.join(", ")}`}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                allInStock
                  ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 cursor-default"
                  : "border-gray-200 bg-gray-50 text-gray-400 line-through"
              }`}
            >
              EU {size}
            </div>
          );
        })}
      </div>
    </div>
  );
}
