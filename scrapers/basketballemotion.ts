// scraper-basketballemotion.ts
// Basketball Emotion — PHP Custom (scroll infinito, sem API JSON)
// URL listagem: https://www.basketballemotion.com/pt/sapatilhas
// Estratégia: sitemap + fetch de cada página de produto

import { createServerClient } from "../lib/supabaseServer";
import * as cheerio from "cheerio";
import { getProductUrlsFromSitemap } from "./sitemap";
import {
  normalizeBrand,
  parseProductName,
  generateSlug,
  cleanPrice,
  extractSizes,
} from "./normalize";

const STORE = "basketballemotion";
const BASE_URL = "https://www.basketballemotion.com";
// Sub-categorias por marca (do menu)
const CATEGORY_URLS = [
  `${BASE_URL}/pt/sapatilhas`,
  `${BASE_URL}/pt/categoria/sapatilhas/basquetebol/nike`,
  `${BASE_URL}/pt/categoria/sapatilhas/basquetebol/adidas`,
  `${BASE_URL}/pt/categoria/sapatilhas/jordan`,
  `${BASE_URL}/pt/categoria/sapatilhas/basquetebol/puma`,
];

interface RawProduct {
  name: string;
  price: string;
  originalPrice?: string;
  link: string;
  image?: string;
  sizes?: { size_eu: string }[];
}

async function scrape() {
  const supabase = createServerClient();
  console.log(`🏀 Basketball Emotion — iniciando scrape...`);
  let totalProcessed = 0;
  const allProducts: RawProduct[] = [];

  // Estratégia 1: sitemap (ideal — lista completa sem scroll infinito)
  console.log(`  📁 A tentar sitemap...`);
  const sitemap = await getProductUrlsFromSitemap(
    BASE_URL,
    /\/pt\/.+sapatilhas/ // URLs de produto contêm /sapatilhas/
  );

  if (sitemap.urls.length > 0) {
    console.log(`  ✅ Sitemap: ${sitemap.urls.length} URLs`);

    // Processa até 200 produtos do sitemap
    for (const url of sitemap.urls.slice(0, 200)) {
      try {
        const product = await scrapeProductPage(url);
        if (product) allProducts.push(product);
      } catch { /* ignora */ }
    }
  } else {
    // Estratégia 2: scraping direto das categorias por marca
    console.log(`  📄 Sitemap não encontrado, a fazer scraping por categorias...`);
    for (const categoryUrl of CATEGORY_URLS) {
      console.log(`    📂 ${categoryUrl}`);
      try {
        const products = await scrapeCategoryPage(categoryUrl);
        allProducts.push(...products);
        console.log(`      ${products.length} produtos`);
      } catch (err: any) {
        console.log(`      ⚠️ ${err.message}`);
      }
    }
  }

  console.log(`  🔍 ${allProducts.length} produtos encontrados`);

  for (const raw of allProducts) {
    try {
      await upsertProduct(supabase, raw);
      totalProcessed++;
    } catch (err: any) {
      console.error(`  ❌ "${raw.name}": ${err.message}`);
    }
  }

  console.log(`🏁 Basketball Emotion: ${totalProcessed} produtos`);
  return { inserted: totalProcessed };
}

async function scrapeCategoryPage(url: string): Promise<RawProduct[]> {
  const products: RawProduct[] = [];

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Shifty/1.0",
      },
    });

    if (!response.ok) return products;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Seletores típicos de PHP custom espanhol
    $("article.product, .product-card, .product-item, .producto").each((_, el) => {
      const $el = $(el);

      const name =
        $el.find(".product-name, .product-title, h3 a, h2 a").first().text().trim();
      if (!name) return;

      const price =
        $el.find(".price, .precio, .product-price").first().text().trim().replace(/[^\d,.]/g, "") || "0";

      const originalPrice =
        $el.find(".price-before, .regular-price, del.precio, .old-price")
          .first()
          .text()
          .trim()
          .replace(/[^\d,.]/g, "") || undefined;

      const link = $el.find("a.product-link, a[href]").first().attr("href") || "";

      const image =
        $el.find("img[src]").first().attr("src") ||
        $el.find("img[data-src]").first().attr("data-src") ||
        undefined;

      products.push({
        name,
        price,
        originalPrice,
        link: link.startsWith("http") ? link : `${BASE_URL}${link}`,
        image,
      });
    });

    // Fallback: schema.org JSON-LD
    if (products.length === 0) {
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).html() || "{}");
          if (data["@type"] === "ItemList" && data.itemListElement) {
            for (const entry of data.itemListElement) {
              const p = entry.item || entry;
              if (p.name) {
                products.push({
                  name: p.name,
                  price: p.offers?.price || "0",
                  link: p.url || "",
                  image: p.image || undefined,
                });
              }
            }
          }
        } catch { /* ignora */ }
      });
    }
  } catch (err: any) {
    console.error(`    ❌ ${err.message}`);
  }

  return products;
}

async function scrapeProductPage(url: string): Promise<RawProduct | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Shifty/1.0",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Nome
    const name =
      $("h1").first().text().trim() ||
      $('meta[property="og:title"]').attr("content") ||
      "";
    if (!name) return null;

    // Preço
    const priceText =
      $('[itemprop="price"]').attr("content") ||
      $(".price, .precio-actual").first().text().trim();
    const price = priceText?.replace(/[^\d,.]/g, "") || "0";

    // Preço original
    const origText =
      $('[itemprop="highPrice"]').attr("content") ||
      $(".price-before, .regular-price, del, .old-price").first().text().trim();
    const originalPrice = origText?.replace(/[^\d,.]/g, "") || undefined;

    // Imagem
    const image =
      $('meta[property="og:image"]').attr("content") ||
      $(".product-image img").first().attr("src") ||
      undefined;

    // Tamanhos
    const sizes: { size_eu: string }[] = [];
    $(".size-option, .talla, .size-selector option, .variations select option").each(
      (_, el) => {
        const text = $(el).text().trim();
        const value = $(el).attr("value") || text;
        if (value && /\d{2}/.test(value) && !/escolha|selecione/i.test(value)) {
          const m = value.match(/(\d{2}(?:[.,]\d)?)/);
          if (m) sizes.push({ size_eu: m[1].replace(",", ".") });
        }
      }
    );

    return { name, price, originalPrice, link: url, image, sizes };
  } catch {
    return null;
  }
}

async function upsertProduct(
  supabase: ReturnType<typeof createServerClient>,
  raw: RawProduct
) {
  const brand = normalizeBrand(
    raw.name.match(/Nike|Jordan|Adidas|Puma|Under Armour|New Balance|Anta|Reebok|Li-Ning/i)?.[0] || "Outra"
  );

  const { model, colorway } = parseProductName(raw.name, brand);
  const slug = generateSlug(brand, model, colorway);
  const price = cleanPrice(raw.price);
  const originalPrice = raw.originalPrice ? cleanPrice(raw.originalPrice) : null;

  if (!price) return;

  const { data: product, error: productError } = await supabase
    .from("products")
    .upsert(
      { slug, name: raw.name.trim(), brand, model, colorway, image_url: raw.image || null },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (productError) throw new Error(`Produto: ${productError.message}`);

  const { error: priceError } = await supabase.from("prices").upsert(
    {
      product_id: product.id,
      store: STORE,
      store_url: raw.link,
      current_price: price,
      original_price: originalPrice,
      in_stock: true,
    },
    { onConflict: "product_id,store" }
  );

  if (priceError) throw new Error(`Preço: ${priceError.message}`);

  // Tamanhos
  if (raw.sizes && raw.sizes.length > 0) {
    await supabase.from("size_availability").delete().eq("product_id", product.id).eq("store", STORE);

    const rows = raw.sizes.map((s) => ({
      product_id: product.id,
      store: STORE,
      size_eu: s.size_eu,
      in_stock: true,
    }));

    const { error: sizeError } = await supabase.from("size_availability").insert(rows);
    if (sizeError) console.error(`    ⚠️ Tamanhos: ${sizeError.message}`);
  }
}

if (require.main === module) {
  scrape()
    .then((r) => { console.log(`✅ ${r.inserted} produtos`); process.exit(0); })
    .catch((err) => { console.error("❌", err); process.exit(1); });
}

export { scrape };
