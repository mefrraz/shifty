// scraper-basketballemotion.ts
// Basketball Emotion — Custom PHP, HTML scraping com Cheerio
// URL: https://www.basketballemotion.com/pt/categoria/sapatilhas/basquetebol/

import { createServerClient } from "../lib/supabaseServer";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import {
  normalizeBrand,
  parseProductName,
  generateSlug,
  cleanPrice,
  extractSizes,
} from "./normalize";

const STORE = "basketballemotion";
const BASE_URL = "https://www.basketballemotion.com";
const CATEGORY_URL = `${BASE_URL}/pt/categoria/sapatilhas/basquetebol/`;

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
  console.log(`🏀 Basketball Emotion — iniciando scrape...`);

  let totalProcessed = 0;
  let page = 1;
  let hasMore = true;
  const allProducts: RawProduct[] = [];

  // Paginação — Basketball Emotion tem listagem paginada
  while (hasMore) {
    const url =
      page === 1
        ? CATEGORY_URL
        : `${CATEGORY_URL}page/${page}/`;

    console.log(`  📄 Página ${page}...`);
    const products = await scrapePage(url);

    if (products.length === 0) {
      hasMore = false;
      break;
    }

    // Verifica se já vimos estes produtos (fim da paginação ou produtos repetidos)
    const newProducts = products.filter(
      (p) => !allProducts.some((existing) => existing.link === p.link)
    );

    if (newProducts.length === 0) {
      hasMore = false;
      break;
    }

    allProducts.push(...newProducts);
    page++;

    // Limite de segurança — 10 páginas
    if (page > 10) hasMore = false;
  }

  console.log(`  🔍 ${allProducts.length} produtos encontrados`);

  // Processa cada produto
  for (const raw of allProducts) {
    try {
      // Tenta buscar detalhes extra na página de produto
      const details = await scrapeProductPage(raw.link);

      await upsertProduct(supabase, {
        ...raw,
        ...details,
      });
      totalProcessed++;
    } catch (err: any) {
      console.error(`  ❌ Erro em "${raw.name}": ${err.message}`);
    }
  }

  console.log(`🏁 Basketball Emotion: ${totalProcessed} produtos`);
  return { inserted: totalProcessed };
}

async function scrapePage(url: string): Promise<RawProduct[]> {
  const products: RawProduct[] = [];

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Shifty/1.0",
        "Accept-Language": "pt-PT,pt;q=0.9",
      },
    });

    if (!response.ok) {
      console.log(`    ⚠️ HTTP ${response.status}`);
      return products;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Seletores típicos de lojas PHP custom
    // Ajustar conforme a estrutura real do site
    const productSelectors = [
      ".product-item",
      ".product",
      ".produto",
      "li.product",
      ".products .item",
      ".product-card",
      ".card-product",
      "[itemtype='http://schema.org/Product']",
    ];

    for (const selector of productSelectors) {
      const els = $(selector);
      if (els.length > 0) {
        els.each((_, el) => {
          const product = extractProduct($, el);
          if (product) products.push(product);
        });
        if (products.length > 0) break;
      }
    }

    // Fallback: procura schema.org JSON-LD
    if (products.length === 0) {
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).html() || "{}");
          if (data["@type"] === "Product" || data["@type"] === "ItemList") {
            const items = data.itemListElement || [data];
            for (const item of items) {
              const p = item.item || item;
              if (p.name) {
                products.push({
                  name: p.name,
                  price: p.offers?.price || "0",
                  link: p.url || p.offers?.url || "",
                  image: p.image || undefined,
                  brand: p.brand?.name || undefined,
                });
              }
            }
          }
        } catch {
          // ignora JSON inválido
        }
      });
    }
  } catch (err: any) {
    console.error(`    ❌ Erro ao fazer fetch: ${err.message}`);
  }

  return products;
}

function extractProduct(
  $: cheerio.CheerioAPI,
  el: AnyNode
): RawProduct | null {
  const $el = $(el);

  const name =
    $el.find(".product-title, .product-name, h2 a, h3 a, .title a, .name a")
      .first()
      .text()
      .trim() ||
    $el.find("h2, h3, .title, .name").first().text().trim() ||
    $el.find("[itemprop='name']").text().trim();

  if (!name) return null;

  const priceText =
    $el.find(".price, .product-price, .amount, [itemprop='price']")
      .first()
      .text()
      .trim() || "0";

  const originalPriceText =
    $el
      .find(".regular-price, .old-price, .was-price, .compare-price, del .amount")
      .first()
      .text()
      .trim() || undefined;

  const link =
    $el.find("a[href]").first().attr("href") || "";
  const fullLink = link.startsWith("http") ? link : `${BASE_URL}${link}`;

  const image =
    $el.find("img[src]").first().attr("src") ||
    $el.find("img[data-src]").first().attr("data-src") ||
    $el.find("[itemprop='image']").attr("content") ||
    undefined;

  return {
    name,
    price: priceText,
    original_price: originalPriceText,
    link: fullLink,
    image: image?.startsWith("http") ? image : image ? `${BASE_URL}${image}` : undefined,
  };
}

async function scrapeProductPage(
  url: string
): Promise<{ sizes?: { size_eu: string }[]; description?: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Shifty/1.0",
      },
    });

    if (!response.ok) return {};
    const html = await response.text();
    const $ = cheerio.load(html);

    // Extrai tamanhos
    const sizes: { size_eu: string }[] = [];
    $(".size-option, .variation-select option, .attribute-select option").each(
      (_, el) => {
        const text = $(el).text().trim();
        const value = $(el).attr("value") || text;
        if (value && !value.includes("Escolha") && !value.includes("Selecione")) {
          const sizeMatch = value.match(/(\d{2}(?:[.,]\d)?)/);
          if (sizeMatch) {
            sizes.push({ size_eu: sizeMatch[1].replace(",", ".") });
          }
        }
      }
    );

    // Se não encontrou tamanhos por select, tenta texto corrido
    if (sizes.length === 0) {
      const sizeSection = $(
        ".product-size, .sizes, .size-guide, .tamanhos"
      ).text();
      if (sizeSection) {
        const extracted = extractSizes(sizeSection);
        extracted.forEach((s) => sizes.push({ size_eu: s.size_eu }));
      }
    }

    // Descrição do produto
    const description =
      $(".product-description, .description, [itemprop='description'], .short-description")
        .first()
        .text()
        .trim() || undefined;

    return { sizes, description };
  } catch {
    return {};
  }
}

async function upsertProduct(
  supabase: ReturnType<typeof createServerClient>,
  raw: RawProduct
) {
  const brand = raw.brand
    ? normalizeBrand(raw.brand)
    : normalizeBrand(
        raw.name.includes("Nike")
          ? "Nike"
          : raw.name.includes("Jordan")
            ? "Jordan"
            : raw.name.includes("Adidas")
              ? "Adidas"
              : raw.name.includes("Puma")
                ? "Puma"
                : raw.name.includes("Under Armour")
                  ? "Under Armour"
                  : raw.name.includes("New Balance")
                    ? "New Balance"
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
    // Primeiro remove tamanhos antigos desta loja
    await supabase
      .from("size_availability")
      .delete()
      .eq("product_id", product.id)
      .eq("store", STORE);

    // Insere novos
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
