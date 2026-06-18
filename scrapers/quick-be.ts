import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env") });
import { createServerClient } from "../lib/supabaseServer";
import * as cheerio from "cheerio";
import { normalizeBrand, parseProductName, generateSlug, cleanPrice, isBasketballShoe } from "./normalize";

const STORE = "basketballemotion";
const BASE_URL = "https://www.basketballemotion.com";
const CATEGORIES = [
  `${BASE_URL}/pt/categoria/sapatilhas/basquetebol/nike`,
  `${BASE_URL}/pt/categoria/sapatilhas/basquetebol/adidas`,
  `${BASE_URL}/pt/categoria/sapatilhas/jordan`,
  `${BASE_URL}/pt/categoria/sapatilhas/basquetebol/puma`,
];

const s = createServerClient();

async function main() {
  let total = 0;
  for (const url of CATEGORIES) {
    console.log(`📂 ${url}`);
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 Shifty/1.0" } });
      if (!res.ok) { console.log(`  HTTP ${res.status}`); continue; }
      const html = await res.text();
      const $ = cheerio.load(html);

      const cards = $("article.product, .product-card, .product-miniature, .product-item");
      console.log(`  ${cards.length} produtos`);
      let count = 0;

      for (let i = 0; i < cards.length && count < 10; i++) {
        const el = cards.eq(i);
        const name = el.find("h3, h2, .product-name, .product-title").first().text().trim();
        if (!name || !isBasketballShoe(name)) continue;

        const priceText = el.find(".price, .product-price").first().text().trim() || "0";
        const price = cleanPrice(priceText) || 0;
        const link = el.find("a[href]").first().attr("href") || "";
        const fullLink = link.startsWith("http") ? link : `${BASE_URL}${link}`;
        const img = el.find("img[src]").first().attr("src") || el.find("img[data-src]").first().attr("data-src") || null;

        const brand = normalizeBrand(name);
        const { model, colorway } = parseProductName(name, brand);
        const slug = generateSlug(brand, model, colorway);

        if (!price) continue;

        // Upsert produto
        const { data: prod, error: perr } = await s.from("products").upsert(
          { slug, name: name.trim(), brand, model, colorway, image_url: img },
          { onConflict: "slug" }
        ).select("id").single();

        if (perr || !prod) { console.log(`    ❌ ${perr?.message}`); continue; }

        // Upsert preço
        await s.from("prices").upsert(
          { product_id: prod.id, store: STORE, store_url: fullLink, current_price: price, in_stock: true },
          { onConflict: "product_id,store" }
        );

        count++;
        total++;
      }
      console.log(`  ✅ ${count} inseridos`);
    } catch (e: any) { console.log(`  ❌ ${e.message}`); }
  }
  console.log(`\n🏁 ${total} produtos`);
}
main();
