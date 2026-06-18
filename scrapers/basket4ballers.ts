// scraper-basket4ballers.ts
// Basket4Ballers — PrestaShop com JSON module
// URL: https://www.basket4ballers.com/pt/

import { createServerClient } from "../lib/supabaseServer";
import * as cheerio from "cheerio";
import {
  normalizeBrand,
  parseProductName,
  generateSlug,
  cleanPrice,
} from "./normalize";

const STORE = "basket4ballers";
const BASE_URL = "https://www.basket4ballers.com/pt/";

// Categorias de sapatilhas de basquetebol
// IDs típicos — ajustar após inspecionar o site
const CATEGORY_URLS = [
  `${BASE_URL}12-sapatilhas-de-basquetebol`,
  `${BASE_URL}13-sapatilhas-basquetebol`,
  `${BASE_URL}14-basquetebol`,
];

interface RawProduct {
  name: string;
  price: string;
  original_price?: string;
  link: string;
  image?: string;
  sizes?: string[];
}

async function scrape() {
  const supabase = createServerClient();
  console.log(`🛒 Basket4Ballers — iniciando scrape...`);

  let totalInserted = 0;
  let totalUpdated = 0;

  for (const categoryUrl of CATEGORY_URLS) {
    console.log(`  📂 Categoria: ${categoryUrl}`);

    try {
      // Tenta primeiro o endpoint JSON (PrestaShop module)
      let products: RawProduct[] = [];
      const jsonUrl = categoryUrl.includes("?")
        ? `${categoryUrl}&json=true`
        : `${categoryUrl}?json=true`;

      const jsonResponse = await fetch(jsonUrl, {
        headers: { "User-Agent": "Shifty/1.0 (basketball-shoe-aggregator)" },
      });

      if (jsonResponse.ok) {
        const text = await jsonResponse.text();
        try {
          const data = JSON.parse(text);
          products = parsePrestaShopJSON(data);
        } catch {
          console.log(`    ⚠️ JSON parse falhou, a tentar HTML...`);
          products = await scrapeHTML(categoryUrl);
        }
      } else {
        console.log(`    ⚠️ JSON endpoint não disponível, a tentar HTML...`);
        products = await scrapeHTML(categoryUrl);
      }

      // Upsert para cada produto
      for (const raw of products) {
        try {
          await upsertProduct(supabase, raw);
          totalInserted++;
        } catch (err: any) {
          console.error(`    ❌ Erro em "${raw.name}": ${err.message}`);
        }
      }

      console.log(`    ✅ ${products.length} produtos processados`);
    } catch (err: any) {
      console.error(`  ❌ Erro na categoria: ${err.message}`);
    }
  }

  console.log(
    `🏁 Basket4Ballers: ${totalInserted} produtos processados`
  );
  return { inserted: totalInserted, updated: totalUpdated };
}

function parsePrestaShopJSON(data: any): RawProduct[] {
  const products: RawProduct[] = [];

  // PrestaShop JSON module pode ter formatos diferentes
  const items = data.products || data.items || data;

  if (!Array.isArray(items)) return products;

  for (const item of items) {
    if (!item.name) continue;

    products.push({
      name: String(item.name).trim(),
      price: String(item.price || 0),
      original_price: item.original_price || item.regular_price || undefined,
      link: item.link || item.url || "",
      image: item.image || item.cover || item.default_image || undefined,
      sizes: item.sizes || item.attributes || undefined,
    });
  }

  return products;
}

async function scrapeHTML(categoryUrl: string): Promise<RawProduct[]> {
  const products: RawProduct[] = [];

  const response = await fetch(categoryUrl, {
    headers: { "User-Agent": "Shifty/1.0 (basketball-shoe-aggregator)" },
  });

  if (!response.ok) {
    console.log(`    ⚠️ HTTP ${response.status} para ${categoryUrl}`);
    return products;
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Produtos na página (seletores típicos de PrestaShop)
  $(".product-miniature, .product-container, article.product").each(
    (_, el) => {
      const $el = $(el);

      const name =
        $el.find(".product-title, .product-name, h3 a, h2 a").first().text().trim() ||
        $el.find("[itemprop='name']").text().trim();

      if (!name) return;

      const price =
        $el.find(".price, .product-price, [itemprop='price']")
          .first()
          .text()
          .trim()
          .replace(/[^\d,.]/g, "") || "0";

      const originalPrice =
        $el
          .find(".regular-price, .old-price, .was-price")
          .first()
          .text()
          .trim()
          .replace(/[^\d,.]/g, "") || undefined;

      const link =
        $el.find("a[href]").first().attr("href") || "";

      const image =
        $el.find("img[src]").first().attr("src") ||
        $el.find("img[data-src]").first().attr("data-src") ||
        undefined;

      products.push({
        name,
        price,
        original_price: originalPrice,
        link,
        image,
      });
    }
  );

  return products;
}

async function upsertProduct(
  supabase: ReturnType<typeof createServerClient>,
  raw: RawProduct
) {
  const brand = normalizeBrand(
    raw.name.includes("Nike") || raw.name.includes("nike")
      ? "Nike"
      : raw.name.includes("Jordan") || raw.name.includes("jordan")
        ? "Jordan"
        : raw.name.includes("Adidas") || raw.name.includes("adidas")
          ? "Adidas"
          : raw.name.includes("Puma") || raw.name.includes("puma")
            ? "Puma"
            : raw.name.includes("Under Armour") || raw.name.includes("UA")
              ? "Under Armour"
              : raw.name.includes("New Balance")
                ? "New Balance"
                : "Outra"
  );

  const { model, colorway } = parseProductName(raw.name, brand);
  const slug = generateSlug(brand, model, colorway);
  const price = cleanPrice(raw.price);
  const originalPrice = raw.original_price ? cleanPrice(raw.original_price) : null;

  if (!price) {
    console.log(`    ⚠️ Preço inválido para "${raw.name}", a saltar`);
    return;
  }

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

  if (productError) {
    throw new Error(`Erro ao inserir produto: ${productError.message}`);
  }

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

  if (priceError) {
    throw new Error(`Erro ao inserir preço: ${priceError.message}`);
  }
}

// Execução standalone
if (require.main === module) {
  scrape()
    .then((result) => {
      console.log(`✅ ${result.inserted} produtos processados`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Erro fatal:", err);
      process.exit(1);
    });
}

export { scrape };
