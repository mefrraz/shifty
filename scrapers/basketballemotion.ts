// scraper-basketballemotion.ts v2
// Extrai: style_code (ref. fornecedor), tamanhos com stock, preço original+atual
// Matching cross-store via style_code

import { createServerClient } from "../lib/supabaseServer";
import * as cheerio from "cheerio";
import { getProductUrlsFromSitemap } from "./sitemap";
import { normalizeBrand, parseProductName, generateSlug, cleanPrice, isBasketballShoe } from "./normalize";

const STORE = "basketballemotion";
const BASE_URL = "https://www.basketballemotion.com";

interface RawProduct {
  name: string;
  brand: string;
  styleCode: string | null;
  currentPrice: number;
  originalPrice: number | null;
  image: string | null;
  storeUrl: string;
  sizes: { size_eu: string; in_stock: boolean }[];
  storeDescription: string | null;
}

async function scrape() {
  const supabase = createServerClient();
  console.log(`🏀 Basketball Emotion v2 — style_code + tamanhos...`);

  // Sitemap
  const sitemap = await getProductUrlsFromSitemap(BASE_URL, /\/pt\/.+sapatilhas/);
  if (sitemap.urls.length === 0) {
    console.log("  ❌ Sitemap vazio");
    return { inserted: 0 };
  }

  console.log(`  📁 ${sitemap.urls.length} URLs no sitemap`);
  let processed = 0;
  let skipped = 0;

  // Processa cada URL de produto
  for (const url of sitemap.urls.slice(0, 30)) {
    try {
      const product = await scrapeProductPage(url);
      if (!product) { skipped++; continue; }
      if (!isBasketballShoe(product.name)) { skipped++; continue; }

      await upsertProduct(supabase, product);
      processed++;
    } catch (err: any) {
      // console.error(`  ❌ ${err.message}`);
      skipped++;
    }
  }

  console.log(`🏁 BE: ${processed} inseridos, ${skipped} saltos`);
  return { inserted: processed };
}

async function scrapeProductPage(url: string): Promise<RawProduct | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Shifty/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    // Nome
    const name = $("h1").first().text().trim() || $('meta[property="og:title"]').attr("content") || "";
    if (!name) return null;

    // Style code — "ref. fornecedor IM5839-001" ou "ref. NI_IM5839-001"
    let styleCode: string | null = null;
    // Padrão: "ref. fornecedor XXXXX-XXX" ou similar
    const refPatterns = [
      /ref\.?\s*fornecedor:?\s*([A-Z0-9]+-[A-Z0-9]+)/i,
      /ref\.?\s*fornecedor:?\s*([A-Z0-9]+)/i,
      /ref\.?\s*NI[_-]?\s*([A-Z0-9]+-[A-Z0-9]+)/i,
      /ref\.\s+([A-Z0-9]+-[A-Z0-9]+)/i,
      />ref\.?\s*fornecedor[^<]*<[^>]*>([A-Z0-9]+-[A-Z0-9]+)/i,
    ];
    for (const pat of refPatterns) {
      const m = html.match(pat);
      if (m) { styleCode = m[1]; break; }
    }

    // Preço atual
    const priceText = $('[itemprop="price"]').attr("content") || $(".price, .current-price .amount").first().text().trim();
    const currentPrice = cleanPrice(priceText) || 0;

    // Preço original
    const origText = $(".old-price, .regular-price, .was-price, .price-before").first().text().trim();
    const originalPrice = cleanPrice(origText) || null;

    // Imagem
    const image = $('meta[property="og:image"]').attr("content") || $(".product-image img").first().attr("src") || null;

    // Marca — extrai do nome (primeira palavra conhecida)
    const brand = normalizeBrand(name);

    // Tamanhos — parse da tabela de tamanhos/stocks
    const sizes: { size_eu: string; in_stock: boolean }[] = [];
    // Basket Emotion mostra tamanhos como texto com estado (Última unidade, Disponibilidade imediata, etc.)
    $("table tr, .size-row, .talla-row").each((_, row) => {
      const text = $(row).text().trim();
      // Ex: "43 EU Última unidade" ou "44 EU Disponibilidade imediata"
      const euMatch = text.match(/(\d{2}(?:[.,]\d)?)\s*(?:EU|EUR)/i);
      if (euMatch) {
        const size_eu = euMatch[1].replace(",", ".");
        const inStock = !/sem disponibilidade|esgotado|indispon/i.test(text);
        if (!sizes.some(s => s.size_eu === size_eu)) {
          sizes.push({ size_eu, in_stock: inStock });
        }
      }
    });

    // Se não encontrou por tabela, procura nos options de select
    if (sizes.length === 0) {
      $("select.size-select option, .size-options li, .sizes button").each((_, el) => {
        const text = $(el).text().trim();
        const val = $(el).attr("value") || text;
        const euMatch = val.match(/(\d{2}(?:[.,]\d)?)/);
        if (euMatch) {
          const size_eu = euMatch[1].replace(",", ".");
          const disabled = $(el).attr("disabled") !== undefined || /esgotado|indispon/i.test(text);
          if (!sizes.some(s => s.size_eu === size_eu)) {
            sizes.push({ size_eu, in_stock: !disabled });
          }
        }
      });
    }

    // Descrição da loja (para input da IA)
    const storeDescription = $(".product-description, .description, [itemprop='description']").first().text().trim() || null;

    return { name, brand, styleCode, currentPrice, originalPrice, image, storeUrl: url, sizes, storeDescription };
  } catch {
    return null;
  }
}

async function upsertProduct(supabase: ReturnType<typeof createServerClient>, raw: RawProduct) {
  const brand = normalizeBrand(raw.brand);
  const { model, colorway } = parseProductName(raw.name, brand);
  const slug = generateSlug(brand, model, colorway);

  if (!raw.currentPrice) return;

  // Upsert produto por style_code (se tiver) ou slug
  const upsertData: any = { slug, name: raw.name.trim(), brand, model, colorway, image_url: raw.image };
  if (raw.styleCode) upsertData.style_code = raw.styleCode;

  let productId: string;

  if (raw.styleCode) {
    // Tenta encontrar por style_code primeiro
    const { data: existing } = await supabase.from("products").select("id").eq("style_code", raw.styleCode).maybeSingle();
    if (existing) {
      productId = existing.id;
      await supabase.from("products").update(upsertData).eq("id", productId);
    } else {
      const { data: created, error } = await supabase.from("products").insert(upsertData).select("id").single();
      if (error) throw new Error(`Insert: ${error.message}`);
      productId = created.id;
    }
  } else {
    // Fallback: upsert por slug
    const { data: upserted, error } = await supabase.from("products").upsert(upsertData, { onConflict: "slug" }).select("id").single();
    if (error) throw new Error(`Upsert: ${error.message}`);
    productId = upserted.id;
  }

  // Upsert preço
  await supabase.from("prices").upsert({
    product_id: productId, store: STORE, store_url: raw.storeUrl,
    current_price: raw.currentPrice, original_price: raw.originalPrice, in_stock: true,
  }, { onConflict: "product_id,store" });

  // Upsert tamanhos
  if (raw.sizes.length > 0) {
    const rows = raw.sizes.map(s => ({ product_id: productId, store: STORE, size_eu: s.size_eu, in_stock: s.in_stock }));
    // Delete old + insert new
    await supabase.from("size_availability").delete().eq("product_id", productId).eq("store", STORE);
    await supabase.from("size_availability").insert(rows);
  }
}

if (require.main === module) { scrape().then(r => { console.log(`✅ ${r.inserted}`); process.exit(0); }).catch(e => { console.error(e); process.exit(1); }); }

export { scrape };
