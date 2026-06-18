import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PriceDisplay from "@/components/PriceDisplay";
import StoreBottomSheet from "@/components/StoreBottomSheet";
import SizeGrid from "@/components/SizeGrid";
import ProductCard from "@/components/ProductCard";
import { getProductBySlug, getRelatedProducts } from "@/lib/data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Sapatilha não encontrada" };
  return { title: `${product.name} — ${product.brand}`, description: `Compra ${product.name} da ${product.brand} ao melhor preço.`, openGraph: { images: product.image_url ? [{ url: product.image_url }] : [] } };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = decodeURIComponent((await params).slug);
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(slug, product.brand, 4);
  const summary = product.summary;
  const brandSlug = product.brand.toLowerCase().replace(/\s+/g, "-");

  const offers = (product.prices ?? []).map((p: any) => ({ store: p.store, storeName: p.store, storeUrl: p.store_url, price: p.current_price, originalPrice: p.original_price, isBestPrice: false }));
  if (offers.length > 0) { const min = Math.min(...offers.map((o: any) => o.price)); offers.forEach((o: any) => { o.isBestPrice = o.price === min; }); }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Breadcrumb */}
      <nav className="text-xs text-[#9CA3AF] mb-5">
        <a href="/" className="hover:text-[#F97316]">Início</a><span className="mx-1">/</span>
        <a href="/catalogo" className="hover:text-[#F97316]">Catálogo</a><span className="mx-1">/</span>
        <a href={`/marca/${brandSlug}`} className="hover:text-[#F97316]">{product.brand}</a><span className="mx-1">/</span>
        <span className="text-[#6B7280]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        {/* Imagem */}
        <div className="bg-[#F3F4F6] rounded-2xl aspect-square flex items-center justify-center overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-contain p-6" />
          ) : (
            <span className="text-[#6B7280] text-sm">📷</span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div>
            <a href={`/marca/${brandSlug}`} className="text-[11px] font-extrabold text-[#F97316] uppercase tracking-[0.1em]">{product.brand}</a>
            <h1 className="text-[26px] font-black text-[#111827] tracking-[-1px] leading-tight mt-1">{product.name}</h1>
            {product.colorway && <p className="text-sm text-[#6B7280] mt-1">{product.colorway}</p>}
          </div>

          {summary && <PriceDisplay maxPrice={summary.max_price} minPrice={summary.min_price} savingsPct={summary.savings_pct} lastUpdated={summary.last_updated} />}

          <StoreBottomSheet offers={offers} />

          {product.description && (
            <div>
              <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.08em] mb-2">Descrição</div>
              <p className="text-sm text-[#6B7280] leading-relaxed">{product.description}</p>
            </div>
          )}

          {product.sizes && product.sizes.length > 0 && <SizeGrid sizes={product.sizes} />}

          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map((t: string) => <span key={t} className="bg-[#F3F4F6] text-[#6B7280] text-[11px] font-medium px-2.5 py-1 rounded-full">{t}</span>)}
            </div>
          )}

          {summary?.last_updated && (
            <p className="text-[11px] text-[#9CA3AF] pt-3 border-t border-[#E5E7EB]">
              Preços atualizados às {new Date(summary.last_updated).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })} · {new Date(summary.last_updated).toLocaleDateString("pt-PT")}
            </p>
          )}
        </div>
      </div>

      {/* Relacionados */}
      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-lg font-extrabold text-[#111827] tracking-[-0.5px] mb-4">Mais {product.brand}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {related.map(p => <ProductCard key={p.id} {...p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
