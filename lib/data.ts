// Data layer — funções de fetch do Supabase para as páginas
// Usado em server components (SSR) e client components

import { createServerAnonClient } from "./supabaseServer";
import type { ProductPriceSummary } from "./supabase";

// Busca produtos para a landing page e catálogo
export async function getProducts({
  brand,
  sort,
  limit = 24,
  offset = 0,
  query,
  playerType,
  onSale,
}: {
  brand?: string;
  sort?: "discount" | "price_asc" | "price_desc" | "newest";
  limit?: number;
  offset?: number;
  query?: string;
  playerType?: string;
  onSale?: boolean;
} = {}) {
  const supabase = createServerAnonClient();

  let q = supabase.from("product_price_summary").select("*", { count: "exact" });

  // Filtros
  if (brand) {
    q = q.ilike("brand", `%${brand}%`);
  }
  if (query) {
    q = q.or(`name.ilike.%${query}%,brand.ilike.%${query}%`);
  }
  if (playerType && playerType !== "all") {
    q = q.eq("player_type", playerType);
  }
  if (onSale) {
    q = q.gt("savings_pct", 0);
  }

  // Ordenação
  switch (sort) {
    case "discount":
      q = q.order("savings_pct", { ascending: false });
      break;
    case "price_asc":
      q = q.order("min_price", { ascending: true });
      break;
    case "price_desc":
      q = q.order("min_price", { ascending: false });
      break;
    case "newest":
    default:
      q = q.order("last_updated", { ascending: false });
      break;
  }

  q = q.range(offset, offset + limit - 1);

  const { data, error, count } = await q;

  if (error) {
    console.error("Erro ao buscar produtos:", error);
    return { products: [], count: 0 };
  }

  return { products: data as ProductPriceSummary[], count: count ?? 0 };
}

// Busca um produto pelo slug (SSR da página de produto)
export async function getProductBySlug(slug: string) {
  const supabase = createServerAnonClient();

  // Produto
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !product) return null;

  // Preços por loja
  const { data: prices } = await supabase
    .from("prices")
    .select("*")
    .eq("product_id", product.id)
    .eq("in_stock", true);

  // Tamanhos
  const { data: sizes } = await supabase
    .from("size_availability")
    .select("*")
    .eq("product_id", product.id)
    .eq("in_stock", true);

  // Resumo de preço
  const { data: summary } = await supabase
    .from("product_price_summary")
    .select("*")
    .eq("id", product.id)
    .single();

  return {
    ...product,
    prices: (prices ?? []) as Array<{
      store: string;
      store_url: string;
      current_price: number;
      original_price: number | null;
      in_stock: boolean;
    }>,
    sizes: (sizes ?? []) as Array<{
      store: string;
      size_eu: string;
      size_us: string | null;
      in_stock: boolean;
    }>,
    summary: (summary ?? null) as {
      max_price: number;
      min_price: number;
      savings_pct: number;
      last_updated: string;
    } | null,
  };
}

// Busca produtos relacionados (mesma marca ou tags similares)
export async function getRelatedProducts(slug: string, brand: string, limit = 6) {
  const supabase = createServerAnonClient();

  const { data } = await supabase
    .from("product_price_summary")
    .select("*")
    .eq("brand", brand)
    .neq("slug", slug)
    .order("last_updated", { ascending: false })
    .limit(limit);

  return (data as ProductPriceSummary[]) ?? [];
}

// Busca todas as marcas distintas
export async function getBrands() {
  const supabase = createServerAnonClient();

  const { data } = await supabase
    .from("product_price_summary")
    .select("brand");

  if (!data) return [];

  const brands = [...new Set(data.map((d: any) => d.brand))].sort();
  return brands;
}

// Busca marcas populares para a landing page
export async function getPopularBrands() {
  const supabase = createServerAnonClient();

  const { data } = await supabase
    .from("product_price_summary")
    .select("brand");

  if (!data) return [];

  // Contagem por marca
  const counts: Record<string, number> = {};
  for (const d of data) {
    counts[d.brand] = (counts[d.brand] || 0) + 1;
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([brand]) => brand);
}
