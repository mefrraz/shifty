import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductCard from "@/components/ProductCard";
import { getProducts, getBrands } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const brand = (await getBrands()).find(b => b.toLowerCase().replace(/\s+/g, "-") === slug);
  return { title: brand ? `${brand} — Sapatilhas de Basquetebol` : "Marca não encontrada" };
}

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const brands = await getBrands();
  const brand = brands.find(b => b.toLowerCase().replace(/\s+/g, "-") === slug);
  if (!brand) notFound();

  const { products } = await getProducts({ brand, sort: "newest", limit: 48 });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <a href="/catalogo" className="text-xs font-semibold text-[#F97316] hover:text-[#EA580C]">← Catálogo</a>
      <h1 className="mt-2 text-[26px] font-black text-[#111827] tracking-[-1px]">{brand}</h1>
      <p className="text-sm text-[#6B7280] mt-0.5 mb-6">{products.length} sapatilha{products.length !== 1 ? "s" : ""}</p>
      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {products.map(p => <ProductCard key={p.id} {...p} />)}
        </div>
      ) : (
        <div className="py-20 text-center text-[#6B7280]">Ainda sem produtos da {brand}.</div>
      )}
    </div>
  );
}
