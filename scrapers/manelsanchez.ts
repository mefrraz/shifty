// scraper-manelsanchez.ts
// Manel Sanchez — PHP Custom (HTML scraping, sem API JSON)
// URL listagem: https://www.manelsanchez.pt/tenis-basquete/
// Preços: normal + MVP (programa fidelidade)

import { createServerClient } from "../lib/supabaseServer";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { getProductUrlsFromSitemap } from "./sitemap";
import {
  normalizeBrand,
  parseProductName,
  generateSlug,
  cleanPrice,
  isBasketballShoe,
} from "./normalize";

const STORE = "manelsanchez";
const BASE_URL = "https://www.manelsanchez.pt";
const CATEGORY_URL = `${BASE_URL}/tenis-basquete/`;

interface RawProduct {
  name: string;
  price: string;
  originalPrice?: string;
  link: string;
  image?: string;
}

async function scrape() {
  const supabase = createServerClient();
  console.log(`👟 Manel Sanchez — iniciando scrape...`);
  let totalProcessed = 0;
  const allProducts: RawProduct[] = [];

  // Estratégia 1: sitemap
  console.log(`  📁 A tentar sitemap...`);
  const sitemap = await getProductUrlsFromSitemap(
    BASE_URL,
    /\.html$/ // URLs de produto terminam em .html
  );

  if (sitemap.urls.length > 0) {
    console.log(`  ✅ Sitemap: ${sitemap.urls.length} URLs`);
    for (const url of sitemap.urls.slice(0, 200)) {
      try {
        const product = await scrapeProductPage(url);
        if (product) allProducts.push(product);
      } catch { /* ignora */ }
    }
  } else {
    // Estratégia 2: HTML scraping da listagem
    console.log(`  📄 A fazer scraping da listagem: ${CATEGORY_URL}`);
    const listProducts = await scrapeListingPage(CATEGORY_URL);
    allProducts.push(...listProducts);
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

  console.log(`🏁 Manel Sanchez: ${totalProcessed} produtos`);
  return { inserted: totalProcessed };
}

async function scrapeListingPage(url: string): Promise<RawProduct[]> {
  const products: RawProduct[] = [];

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Shifty/1.0",
      },
    });

    if (!response.ok) {
      console.log(`    ⚠️ HTTP ${response.status}`);
      return products;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Estrutura Manel Sanchez: produtos em <li> com <h2><a> para nome
    // Preços: "120,00€" (normal) e "MVP: 102,00€" (desconto)
    $("li.producto, .productos-lista li, .product-item").each((_, el: AnyNode) => {
      const $el = $(el);

      // Nome
      const name = $el.find("h2 a, h3 a, .product-name a").first().text().trim();
      if (!name) return;

      // Link
      const linkEl = $el.find("h2 a, h3 a").first();
      const link = linkEl.attr("href") || "";

      // Preço: procura o texto antes de "MVP:"
      const fullText = $el.text();
      const mvpMatch = fullText.match(/MVP:\s*([\d.,]+)€?/);
      const normalPriceMatch = fullText.match(/([\d.,]+)€/);

      let price = "0";
      let originalPrice: string | undefined;

      if (mvpMatch) {
        // MVP é o preço com desconto (mais baixo)
        price = mvpMatch[1];
        // Preço normal é o primeiro valor antes de MVP
        if (normalPriceMatch) {
          originalPrice = normalPriceMatch[1];
        }
      } else if (normalPriceMatch) {
        price = normalPriceMatch[1];
      }

      // Imagem
      const image = $el.find("img[src]").first().attr("src") || undefined;

      products.push({
        name,
        price,
        originalPrice,
        link: link.startsWith("http") ? link : `${BASE_URL}${link}`,
        image,
      });
    });

    // Fallback: schema.org JSON-LD se existir
    if (products.length === 0) {
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).html() || "{}");
          if (data["@type"] === "ItemList" && data.itemListElement) {
            for (const entry of data.itemListElement) {
              const p = entry.item || entry;
              if (p.name && p["@type"] === "Product") {
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

    // Nome: h1 ou meta og:title
    const name =
      $("h1").first().text().trim() ||
      $('meta[property="og:title"]').attr("content") ||
      "";
    if (!name) return null;

    // Preço
    const fullText = $("body").text();
    const mvpMatch = fullText.match(/MVP:\s*([\d.,]+)€?/);
    const normalPriceMatch = fullText.match(/([\d.,]+)€/);

    let price = "0";
    let originalPrice: string | undefined;

    if (mvpMatch) {
      price = mvpMatch[1];
      if (normalPriceMatch && normalPriceMatch[1] !== mvpMatch[1]) {
        originalPrice = normalPriceMatch[1];
      }
    } else if (normalPriceMatch) {
      price = normalPriceMatch[1];
    }

    // Imagem
    const image =
      $('meta[property="og:image"]').attr("content") ||
      $(".product-image img").first().attr("src") ||
      undefined;

    return { name, price, originalPrice, link: url, image };
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

  // Filtra não-sapatilhas
  if (!isBasketballShoe(raw.name)) return;

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
}

if (require.main === module) {
  scrape()
    .then((r) => { console.log(`✅ ${r.inserted} produtos`); process.exit(0); })
    .catch((err) => { console.error("❌", err); process.exit(1); });
}

export { scrape };
