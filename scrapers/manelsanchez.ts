// scraper-manelsanchez.ts v2
// Extrai: Ref: (style_code), tamanhos, preço normal+MVP

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env") });

import { createServerClient } from "../lib/supabaseServer";
import * as cheerio from "cheerio";
import { getProductUrlsFromSitemap } from "./sitemap";
import { normalizeBrand, parseProductName, generateSlug, cleanPrice, isBasketballShoe } from "./normalize";

const STORE = "manelsanchez";
const BASE_URL = "https://www.manelsanchez.pt";

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
  console.log(`👟 Manel Sanchez v2 — style_code + tamanhos...`);

  // Sitemap
  const sitemap = await getProductUrlsFromSitemap(BASE_URL, /\.html$/);
  if (sitemap.urls.length === 0) {
    // Tenta o sitemap de artigos diretamente
    const sitemap2 = await getProductUrlsFromSitemap(`${BASE_URL}/sitemap_articles.xml`, /\.html$/);
    if (sitemap2.urls.length > 0) {
      console.log(`  📁 ${sitemap2.urls.length} URLs via sitemap_articles.xml`);
      return await processUrls(supabase, sitemap2.urls);
    }
    console.log("  ❌ Sitemap vazio");
    return { inserted: 0 };
  }

  console.log(`  📁 ${sitemap.urls.length} URLs`);
  return await processUrls(supabase, sitemap.urls);
}

async function processUrls(supabase: ReturnType<typeof createServerClient>, urls: string[]) {
  let processed = 0;
  let skipped = 0;

  for (const url of urls.slice(0, 50)) {
    try {
      const product = await scrapeProductPage(url);
      if (!product) { skipped++; continue; }
      if (!isBasketballShoe(product.name)) { skipped++; continue; }

      await upsertProduct(supabase, product);
      processed++;
    } catch {
      skipped++;
    }
  }

  console.log(`🏁 MS: ${processed} inseridos, ${skipped} saltos`);
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

    // Nome — h1 ou breadcrumb
    const name = $("h1").first().text().trim() || $('meta[property="og:title"]').attr("content") || "";
    if (!name) return null;

    // Style code — "Ref: KH9153"
    let styleCode: string | null = null;
    const refMatch = html.match(/Ref:\s*([A-Z0-9]+)/i);
    if (refMatch) styleCode = refMatch[1];

    // Preço — Manel Sanchez tem preço normal + MVP
    const fullText = $("body").text();
    const mvpMatch = fullText.match(/MVP:\s*([\d.,]+)€?/);
    const normalMatch = fullText.match(/([\d.,]+)€/);

    let currentPrice = 0;
    let originalPrice: number | null = null;

    if (mvpMatch) {
      currentPrice = cleanPrice(mvpMatch[1]) || 0;
      if (normalMatch && normalMatch[1] !== mvpMatch[1]) {
        originalPrice = cleanPrice(normalMatch[1]);
      }
    } else if (normalMatch) {
      currentPrice = cleanPrice(normalMatch[1]) || 0;
    }

    // Imagem
    const image = $('meta[property="og:image"]').attr("content") || $("img.product-image").first().attr("src") || null;

    // Marca
    const brand = normalizeBrand(name);

    // Tamanhos — Manel Sanchez mostra numa select ou lista
    const sizes: { size_eu: string; in_stock: boolean }[] = [];
    $("select option, .size-option, .talla-option").each((_, el) => {
      const text = $(el).text().trim();
      const val = $(el).attr("value") || text;
      const euMatch = val.match(/(\d{2}(?:[.,]\d{1,2})?)/);
      if (euMatch && !/escolha|selecione|choose/i.test(val)) {
        const size_eu = euMatch[1].replace(",", ".");
        if (!sizes.some(s => s.size_eu === size_eu)) {
          sizes.push({ size_eu, in_stock: true });
        }
      }
    });

    // Se não encontrou, procura números com frações (ex: "42 2/3")
    if (sizes.length === 0) {
      const fractionMatches = fullText.match(/(\d{2}\s*\d\/\d)/g);
      if (fractionMatches) {
        for (const m of fractionMatches) {
          const size_eu = m.replace(/\s+/g, " ").trim();
          if (!sizes.some(s => s.size_eu === size_eu)) {
            sizes.push({ size_eu, in_stock: true });
          }
        }
      }
    }

    // Descrição
    const storeDescription = $(".product-description, .description, .producto-descripcion").first().text().trim() || null;

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

  const upsertData: any = { slug, name: raw.name.trim(), brand, model, colorway, image_url: raw.image };
  if (raw.styleCode) upsertData.style_code = raw.styleCode;

  let productId: string;

  if (raw.styleCode) {
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
    const { data: upserted, error } = await supabase.from("products").upsert(upsertData, { onConflict: "slug" }).select("id").single();
    if (error) throw new Error(`Upsert: ${error.message}`);
    productId = upserted.id;
  }

  await supabase.from("prices").upsert({
    product_id: productId, store: STORE, store_url: raw.storeUrl,
    current_price: raw.currentPrice, original_price: raw.originalPrice, in_stock: true,
  }, { onConflict: "product_id,store" });

  if (raw.sizes.length > 0) {
    const rows = raw.sizes.map(s => ({ product_id: productId, store: STORE, size_eu: s.size_eu, in_stock: s.in_stock }));
    await supabase.from("size_availability").delete().eq("product_id", productId).eq("store", STORE);
    await supabase.from("size_availability").insert(rows);
  }
}

if (require.main === module) { scrape().then(r => { console.log(`✅ ${r.inserted}`); process.exit(0); }).catch(e => { console.error(e); process.exit(1); }); }

export { scrape };
