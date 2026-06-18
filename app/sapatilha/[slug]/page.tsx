import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PriceDisplay from "@/components/PriceDisplay";
import StoreBottomSheet from "@/components/StoreBottomSheet";
import SizeGrid from "@/components/SizeGrid";
import ProductCard from "@/components/ProductCard";
import { getProductBySlug, getRelatedProducts, getProducts } from "@/lib/data";

const STORE_LOGOS: Record<string, { name: string; domain: string }> = {
  manelsanchez: { name: "Manel Sanchez", domain: "manelsanchez.pt" },
  basketballemotion: { name: "Basketball Emotion", domain: "basketballemotion.com" },
  basket4ballers: { name: "Basket4Ballers", domain: "basket4ballers.com" },
  nike: { name: "Nike PT", domain: "nike.com" },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Sapatilha não encontrada" };
  return { title: `${product.name} · ${product.brand}`, description: `Compra ${product.name} da ${product.brand}. ${(product.prices ?? []).length} lojas, desde ${product.summary?.min_price ?? "?"}€.` };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = decodeURIComponent((await params).slug);
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const brandSlug = product.brand.toLowerCase().replace(/\s+/g, "-");
  const summary = product.summary;
  const prices = (product.prices ?? []) as any[];
  const sizes = (product.sizes ?? []) as any[];

  // Ofertas para o bottom sheet
  const offers = prices.map((p: any) => ({ store: p.store, storeName: STORE_LOGOS[p.store]?.name || p.store, storeUrl: p.store_url, price: p.current_price, originalPrice: p.original_price, isBestPrice: false }));
  if (offers.length > 0) { const min = Math.min(...offers.map((o: any) => o.price)); offers.forEach((o: any) => { o.isBestPrice = o.price === min; }); }

  // Relacionados (mesma marca)
  const related = await getRelatedProducts(slug, product.brand, 4);

  // Mais da mesma marca (catálogo visual)
  const { products: moreFromBrand } = await getProducts({ brand: product.brand, sort: "newest", limit: 8 });
  const filteredMore = moreFromBrand.filter(p => p.slug !== slug).slice(0, 6);

  // Format
  const fmt = (v: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(v);
  const fmtDecimal = (v: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(v);

  // Encontra o range de preços entre lojas
  const priceRange = prices.length > 0
    ? { min: Math.min(...prices.map((p: any) => p.current_price)), max: Math.max(...prices.map((p: any) => p.current_price)) }
    : null;

  // Tamanhos agrupados por loja
  const sizesByStore: Record<string, { size_eu: string; in_stock: boolean }[]> = {};
  for (const s of sizes) {
    if (!sizesByStore[s.store]) sizesByStore[s.store] = [];
    sizesByStore[s.store].push({ size_eu: s.size_eu, in_stock: s.in_stock });
  }

  return (
    <div>
      {/* Breadcrumb bar */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-1.5 text-xs text-[#9CA3AF] overflow-x-auto whitespace-nowrap">
          <a href="/" className="hover:text-[#F97316] transition-colors font-medium">Início</a>
          <span className="text-[#D1D5DB]">→</span>
          <a href="/catalogo" className="hover:text-[#F97316] transition-colors font-medium">Catálogo</a>
          <span className="text-[#D1D5DB]">→</span>
          <a href={`/marca/${brandSlug}`} className="hover:text-[#F97316] transition-colors font-medium">{product.brand}</a>
          <span className="text-[#D1D5DB]">→</span>
          <span className="text-[#374151] font-semibold truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Product header — mobile */}
        <div className="lg:hidden mb-4">
          <a href={`/marca/${brandSlug}`} className="text-[11px] font-extrabold text-[#F97316] uppercase tracking-[0.1em]">{product.brand}</a>
          <h1 className="text-2xl font-black text-[#111827] tracking-[-1px] mt-1">{product.name}</h1>
          {product.colorway && <p className="text-sm text-[#6B7280] mt-0.5">{product.colorway}</p>}
          {summary && (
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#111827] tracking-[-0.5px]">{fmt(summary.min_price)}</span>
              {summary.savings_pct > 0 && (
                <>
                  <span className="text-base text-[#D1D5DB] line-through">{fmt(summary.max_price)}</span>
                  <span className="bg-[#F97316] text-white text-xs font-extrabold px-2 py-1 rounded-md">-{Math.round(summary.savings_pct)}%</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
          {/* COLUNA ESQUERDA — Galeria de imagens */}
          <div className="lg:col-span-3">
            <div className="sticky top-20">
              <div className="bg-[#F3F4F6] rounded-2xl aspect-square flex items-center justify-center overflow-hidden mb-3">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-contain p-6" />
                ) : (
                  <div className="text-center text-[#9CA3AF]">
                    <div className="text-4xl mb-2">👟</div>
                    <span className="text-xs">Sem imagem</span>
                  </div>
                )}
              </div>

              {/* Thumbnails row (placeholder para futuras imagens) */}
              {product.image_url && (
                <div className="flex gap-2">
                  <div className="w-16 h-16 rounded-xl border-2 border-[#F97316] bg-[#F3F4F6] flex items-center justify-center overflow-hidden">
                    <img src={product.image_url} alt="" className="w-full h-full object-contain p-1" />
                  </div>
                  {product.image_url && <div className="w-16 h-16 rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] flex items-center justify-center text-[10px] text-[#9CA3AF]">+ fotos</div>}
                </div>
              )}
            </div>
          </div>

          {/* COLUNA DIREITA — Info + Compra */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Header desktop */}
            <div className="hidden lg:block">
              <a href={`/marca/${brandSlug}`} className="text-[11px] font-extrabold text-[#F97316] uppercase tracking-[0.1em] hover:text-[#EA580C]">{product.brand}</a>
              <h1 className="text-[28px] font-black text-[#111827] tracking-[-1.5px] mt-1 leading-tight">{product.name}</h1>
              {product.colorway && <p className="text-sm text-[#6B7280] mt-1">{product.colorway}</p>}
            </div>

            {/* Preço + Botão Comprar */}
            <div className="lg:hidden">
              {summary && <PriceDisplay maxPrice={summary.max_price} minPrice={summary.min_price} savingsPct={summary.savings_pct} lastUpdated={summary.last_updated} />}
              <div className="mt-3"><StoreBottomSheet offers={offers} /></div>
            </div>

            {/* Preço desktop */}
            <div className="hidden lg:block">
              {summary && (
                <div className="bg-[#F9FAFB] rounded-2xl p-5">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    {summary.savings_pct > 0 && <span className="text-xl text-[#D1D5DB] line-through">{fmt(summary.max_price)}</span>}
                    <span className="text-[38px] font-black text-[#111827] tracking-[-2px]">{fmt(summary.min_price)}</span>
                    {summary.savings_pct > 0 && (
                      <span className="bg-[#F97316] text-white text-sm font-extrabold px-3 py-1.5 rounded-lg">Poupa {Math.round(summary.savings_pct)}%</span>
                    )}
                  </div>
                  {priceRange && priceRange.max > priceRange.min && (
                    <p className="text-sm text-[#6B7280] mt-2">Varia entre {fmt(priceRange.min)} e {fmt(priceRange.max)} nas {prices.length} lojas</p>
                  )}
                  {summary.last_updated && (
                    <p className="text-[11px] text-[#9CA3AF] mt-2">Atualizado às {new Date(summary.last_updated).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</p>
                  )}
                </div>
              )}
              <div className="mt-4"><StoreBottomSheet offers={offers} /></div>
            </div>

            {/* Comparação de lojas */}
            {prices.length > 1 && (
              <div>
                <h3 className="text-sm font-extrabold text-[#111827] tracking-[-0.3px] mb-3">Comparação de preços</h3>
                <div className="space-y-2">
                  {offers.sort((a: any, b: any) => a.price - b.price).map((o: any) => (
                    <div key={o.store} className={`flex items-center justify-between px-4 py-3 rounded-xl ${o.isBestPrice ? "bg-[#FFF7ED] border border-[#FED7AA]" : "bg-white border border-[#E5E7EB]"}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-xs font-black text-[#9CA3AF]">
                          {o.storeName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[#111827]">{o.storeName}</div>
                          <div className="text-[10px] text-[#9CA3AF]">{STORE_LOGOS[o.store]?.domain}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {o.originalPrice && o.originalPrice > o.price && (
                          <span className="text-xs text-[#D1D5DB] line-through hidden sm:inline">{fmtDecimal(o.originalPrice)}</span>
                        )}
                        <span className={`text-lg font-black tracking-[-0.5px] ${o.isBestPrice ? "text-[#111827]" : "text-[#6B7280]"}`}>{fmtDecimal(o.price)}</span>
                        <a href={o.storeUrl} target="_blank" rel="noopener noreferrer"
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${o.isBestPrice ? "bg-[#F97316] text-white hover:bg-[#EA580C]" : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"}`}>
                          Ir à loja →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Só 1 loja — mostrar diretamente */}
            {prices.length === 1 && (
              <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#EA580C] uppercase tracking-[0.06em]">Disponível em</div>
                    <div className="text-lg font-extrabold text-[#111827] mt-0.5">{STORE_LOGOS[prices[0].store]?.name || prices[0].store}</div>
                    <div className="text-[11px] text-[#9CA3AF]">{STORE_LOGOS[prices[0].store]?.domain}</div>
                  </div>
                  <a href={prices[0].store_url} target="_blank" rel="noopener noreferrer"
                    className="bg-[#F97316] text-white text-sm font-extrabold px-5 py-3 rounded-xl hover:bg-[#EA580C] transition-colors">
                    Comprar por {fmtDecimal(prices[0].current_price)} →
                  </a>
                </div>
              </div>
            )}

            {/* Descrição IA */}
            {product.description && (
              <div>
                <h3 className="text-sm font-extrabold text-[#111827] tracking-[-0.3px] mb-2">Sobre esta sapatilha</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((t: string) => (
                  <span key={t} className="bg-[#F3F4F6] text-[#6B7280] text-[11px] font-medium px-2.5 py-1 rounded-full">{t}</span>
                ))}
              </div>
            )}

            {/* Especificações */}
            <div className="bg-[#F9FAFB] rounded-2xl p-5">
              <h3 className="text-sm font-extrabold text-[#111827] tracking-[-0.3px] mb-3">Detalhes</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-[0.06em]">Marca</div>
                  <div className="font-semibold text-[#111827]">{product.brand}</div>
                </div>
                {product.model && (
                  <div>
                    <div className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-[0.06em]">Modelo</div>
                    <div className="font-semibold text-[#111827]">{product.model}</div>
                  </div>
                )}
                {product.colorway && (
                  <div>
                    <div className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-[0.06em]">Colorway</div>
                    <div className="font-semibold text-[#111827]">{product.colorway}</div>
                  </div>
                )}
                {product.player_type && (
                  <div>
                    <div className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-[0.06em]">Posição</div>
                    <div className="font-semibold text-[#111827]">{product.player_type === "guard" ? "Base" : product.player_type === "forward" ? "Extremo" : product.player_type === "center" ? "Poste" : product.player_type}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Tamanhos */}
            <SizeGrid sizes={sizes} />

            {/* Tamanhos por loja */}
            {Object.keys(sizesByStore).length > 0 && (
              <div>
                <h3 className="text-sm font-extrabold text-[#111827] tracking-[-0.3px] mb-3">Disponibilidade por loja</h3>
                <div className="space-y-3">
                  {Object.entries(sizesByStore).map(([store, szs]) => {
                    const sorted = [...szs].sort((a, b) => parseFloat(a.size_eu) - parseFloat(b.size_eu));
                    return (
                      <div key={store} className="bg-white border border-[#E5E7EB] rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-[10px] font-black text-[#9CA3AF]">
                            {STORE_LOGOS[store]?.name?.charAt(0) || store.charAt(0)}
                          </div>
                          <span className="text-xs font-bold text-[#374151]">{STORE_LOGOS[store]?.name || store}</span>
                          <span className="text-[10px] text-[#9CA3AF]">· {szs.filter(s => s.in_stock).length} tamanhos</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {sorted.map(sz => (
                            <div key={sz.size_eu}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${sz.in_stock ? "border-[#E5E7EB] bg-white text-[#374151]" : "border-dashed border-[#E5E7EB] bg-[#F9FAFB] text-[#D1D5DB] line-through"}`}>
                              EU {sz.size_eu}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mais desta marca */}
        {filteredMore.length > 0 && (
          <section className="mt-16">
            <div className="flex items-end justify-between mb-5">
              <div>
                <div className="text-[11px] font-bold text-[#F97316] uppercase tracking-[0.12em] mb-1">Explorar</div>
                <h2 className="text-xl font-extrabold text-[#111827] tracking-[-0.5px]">Mais {product.brand}</h2>
              </div>
              <a href={`/marca/${brandSlug}`} className="text-sm font-semibold text-[#F97316] hover:text-[#EA580C]">Ver tudo →</a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {filteredMore.map(p => <ProductCard key={p.id} {...p} />)}
            </div>
          </section>
        )}

        {/* Relacionados (fechar com chave de ouro) */}
        {related.length > 0 && (
          <section className="mt-12 pb-8">
            <div className="flex items-end justify-between mb-5">
              <div>
                <div className="text-[11px] font-bold text-[#F97316] uppercase tracking-[0.12em] mb-1">Relacionados</div>
                <h2 className="text-xl font-extrabold text-[#111827] tracking-[-0.5px]">Também pode gostar</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {related.map(p => <ProductCard key={p.id} {...p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
