// scraper-manelsanchez.ts
// Manel Sanchez — Custom PHP com ?format=json + schema.org
// URL: https://www.manelsanchez.pt/

import { createServerClient } from "../lib/supabaseServer";
import * as cheerio from "cheerio";
import {
  normalizeBrand,
  parseProductName,
  generateSlug,
  cleanPrice,
  extractSizes,
} from "./normalize";

const STORE = "manelsanchez";
const BASE_URL = "https://www.manelsanchez.pt";

// Categorias de sapatilhas de basquetebol
const CATEGORY_URLS = [
  `${BASE_URL}/categoria/sapatilhas/basquetebol/`,
  `${BASE_URL}/categoria/calcado/basquetebol/`,
  `${BASE_URL}/loja/categoria/sapatilhas-basquetebol/`,
  `${BASE_URL}/product-category/basquetebol/`,
];

interface RawProduct {
  name: string;
  price: string;
  original_price?: string;
  link: string;
  image?: string;
  brand?: string;
  sizes?: { size_eu: string }[];
}

async function scrape() {
  const supabase = createServerClient();
  console.log(`👟 Manel Sanchez — iniciando scrape...`);

  let allProducts: RawProduct[] = [];

  for (const categoryUrl of CATEGORY_URLS) {
    console.log(`  📂 Tentando: ${categoryUrl}`);

    try {
      // Tenta formato JSON primeiro
      let products: RawProduct[] = [];

      const jsonUrl = categoryUrl.includes("?")
        ? `${categoryUrl}&format=json`
        : `${categoryUrl}?format=json`;

      const jsonResponse = await fetch(jsonUrl, {
        headers: {
          "User-Agent": "Shifty/1.0 (basketball-shoe-aggregator)",
          Accept: "application/json",
        },
      });

      if (jsonResponse.ok) {
        const contentType = jsonResponse.headers.get("content-type") || "";
        if (contentType.includes("json")) {
          const data = await jsonResponse.json();
          products = parseManelSanchezJSON(data);
          console.log(`    ✅ JSON: ${products.length} produtos`);
        }
      }

      // Fallback: HTML com schema.org
      if (products.length === 0) {
        products = await scrapeHTML(categoryUrl);
        console.log(`    📄 HTML: ${products.length} produtos`);
      }

      if (products.length > 0) {
        allProducts = products;
        break; // Encontrou a categoria correta
      }
    } catch (err: any) {
      console.log(`    ⚠️ ${err.message}`);
    }
  }

  if (allProducts.length === 0) {
    console.log("  ⚠️ Nenhum produto encontrado. A verificar estrutura do site...");
    // Última tentativa: scrape da homepage e procura links de categorias
    allProducts = await discoverAndScrape();
  }

  console.log(`  🔍 ${allProducts.length} produtos encontrados`);

  let processed = 0;
  for (const raw of allProducts) {
    try {
      await upsertProduct(supabase, raw);
      processed++;
    } catch (err: any) {
      console.error(`  ❌ "${raw.name}": ${err.message}`);
    }
  }

  console.log(`🏁 Manel Sanchez: ${processed} produtos`);
  return { inserted: processed };
}

function parseManelSanchezJSON(data: any): RawProduct[] {
  const products: RawProduct[] = [];

  // Tenta vários formatos comuns de JSON de loja
  const items = data.products || data.items || data.data || data.posts || data;

  if (!Array.isArray(items)) {
    // Pode ser objeto com chaves
    const arr = Object.values(items).filter(
      (v) => typeof v === "object" && v !== null && "name" in (v as any)
    );
    if (arr.length > 0) {
      return parseManelSanchezJSON(arr);
    }
    return products;
  }

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const name = item.name || item.title || item.product_name;
    if (!name) continue;

    products.push({
      name: String(name).trim(),
      price: String(item.price || item.current_price || item.sale_price || 0),
      original_price: item.original_price || item.regular_price || undefined,
      link: item.link || item.url || item.permalink || "",
      image:
        item.image || item.thumbnail || item.featured_image || item.image_url || undefined,
      brand: item.brand || item.manufacturer || undefined,
      sizes: item.sizes || item.variations || undefined,
    });
  }

  return products;
}

async function scrapeHTML(url: string): Promise<RawProduct[]> {
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

    // Schema.org JSON-LD
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || "{}");
        const processItem = (item: any) => {
          if (item["@type"] === "Product" && item.name) {
            products.push({
              name: item.name,
              price: item.offers?.price || "0",
              link: item.url || item.offers?.url || "",
              image: item.image || undefined,
              brand: item.brand?.name || undefined,
            });
          }
        };

        if (data["@graph"]) {
          data["@graph"].forEach(processItem);
        } else if (data["@type"] === "ItemList" && data.itemListElement) {
          data.itemListElement.forEach((entry: any) => {
            processItem(entry.item || entry);
          });
        } else {
          processItem(data);
        }
      } catch {
        // ignora
      }
    });

    // Fallback: scraping visual de produtos
    if (products.length === 0) {
      const selectors = [
        ".product",
        ".produto",
        ".product-item",
        ".product-card",
        "li.product",
        "[itemtype='http://schema.org/Product']",
        ".woocommerce-product",
        ".type-product",
      ];

      for (const selector of selectors) {
        const els = $(selector);
        if (els.length > 0) {
          els.each((_, el) => {
            const $el = $(el);
            const name =
              $el.find("h2, h3, .product-title, .product-name, .woocommerce-loop-product__title")
                .first()
                .text()
                .trim();

            if (!name) return;

            const priceText =
              $el
                .find(".price, .amount, .woocommerce-Price-amount")
                .first()
                .text()
                .trim() || "0";

            const link =
              $el.find("a[href]").first().attr("href") || "";

            const image =
              $el.find("img[src]").first().attr("src") ||
              $el.find("img[data-src]").first().attr("data-src") ||
              undefined;

            products.push({
              name,
              price: priceText,
              link: link.startsWith("http") ? link : `${BASE_URL}${link}`,
              image,
            });
          });
          break;
        }
      }
    }
  } catch (err: any) {
    console.error(`    ❌ ${err.message}`);
  }

  return products;
}

async function discoverAndScrape(): Promise<RawProduct[]> {
  // Tenta descobrir categorias de sapatilhas a partir da homepage
  console.log("  🔎 A descobrir categorias...");
  const allProducts: RawProduct[] = [];

  try {
    const response = await fetch(BASE_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Shifty/1.0",
      },
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Procura links que contenham "basquetebol", "sapatilha", "calcado"
    const categoryLinks: string[] = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      const text = $(el).text().toLowerCase();
      if (
        (href.includes("basquetebol") ||
          href.includes("sapatilha") ||
          href.includes("calcado") ||
          text.includes("basquetebol") ||
          text.includes("sapatilha")) &&
        !categoryLinks.includes(href)
      ) {
        categoryLinks.push(href.startsWith("http") ? href : `${BASE_URL}${href}`);
      }
    });

    console.log(`    🔗 ${categoryLinks.length} links de categoria encontrados`);

    for (const link of categoryLinks.slice(0, 5)) {
      const products = await scrapeHTML(link);
      allProducts.push(...products);
    }
  } catch (err: any) {
    console.error(`    ❌ ${err.message}`);
  }

  return allProducts;
}

async function upsertProduct(
  supabase: ReturnType<typeof createServerClient>,
  raw: RawProduct
) {
  const brand = raw.brand
    ? normalizeBrand(raw.brand)
    : normalizeBrand(
        raw.name.includes("Nike") ? "Nike"
        : raw.name.includes("Jordan") ? "Jordan"
        : raw.name.includes("Adidas") ? "Adidas"
        : raw.name.includes("Puma") ? "Puma"
        : raw.name.includes("Under Armour") ? "Under Armour"
        : raw.name.includes("New Balance") ? "New Balance"
        : "Outra"
      );

  const { model, colorway } = parseProductName(raw.name, brand);
  const slug = generateSlug(brand, model, colorway);
  const price = cleanPrice(raw.price);
  const originalPrice = raw.original_price ? cleanPrice(raw.original_price) : null;

  if (!price) return;

  // Upsert do produto
  const { data: product, error: productError } = await supabase
    .from("products")
    .upsert(
      {
        slug,
        name: raw.name.trim(),
        brand,
        model,
        colorway,
        image_url: raw.image || null,
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (productError) throw new Error(`Produto: ${productError.message}`);

  // Upsert do preço
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

  // Upsert de tamanhos
  if (raw.sizes && raw.sizes.length > 0) {
    await supabase
      .from("size_availability")
      .delete()
      .eq("product_id", product.id)
      .eq("store", STORE);

    const sizeRows = raw.sizes.map((s) => ({
      product_id: product.id,
      store: STORE,
      size_eu: s.size_eu,
      in_stock: true,
    }));

    const { error: sizeError } = await supabase
      .from("size_availability")
      .insert(sizeRows);

    if (sizeError) {
      console.error(`    ⚠️ Tamanhos: ${sizeError.message}`);
    }
  }
}

// Execução standalone
if (require.main === module) {
  scrape()
    .then((result) => {
      console.log(`✅ ${result.inserted} produtos`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Erro fatal:", err);
      process.exit(1);
    });
}

export { scrape };
