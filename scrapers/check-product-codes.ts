// check-product-codes.ts — Verifica se as paginas de produto tem SKU/GTIN/MPN
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env") });

import { createServerClient } from "../lib/supabaseServer";
import * as cheerio from "cheerio";

const supabase = createServerClient();

async function main() {
  // Busca alguns produtos com preços
  const { data: prices } = await supabase.from("prices").select("store, store_url, product_id").limit(10);
  if (!prices) { console.log("Sem dados"); return; }

  for (const p of prices) {
    console.log(`\n🔍 ${p.store} — ${p.store_url}`);
    try {
      const res = await fetch(p.store_url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Shifty/1.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) { console.log(`  HTTP ${res.status}`); continue; }

      const html = await res.text();
      const $ = cheerio.load(html);

      // Procura por códigos de produto comuns
      const patterns = [
        // Meta tags
        { sel: 'meta[property="product:retailer_item_id"]', attr: "content", label: "retailer_item_id" },
        { sel: 'meta[name="sku"]', attr: "content", label: "meta-sku" },
        { sel: 'meta[property="og:sku"]', attr: "content", label: "og:sku" },
        { sel: 'meta[itemprop="sku"]', attr: "content", label: "itemprop-sku" },
        { sel: 'meta[itemprop="mpn"]', attr: "content", label: "mpn" },
        { sel: 'meta[itemprop="gtin13"]', attr: "content", label: "gtin13" },
        // Schema.org JSON-LD
        { sel: 'script[type="application/ld+json"]', attr: null, label: "json-ld" },
        // Texto visível
        { sel: ".product-reference, .sku, .reference, .product-code, [itemprop='sku']", attr: null, label: "css-sku" },
      ];

      for (const { sel, attr, label } of patterns) {
        const el = $(sel).first();
        if (el.length > 0) {
          const val = attr ? el.attr(attr) : el.text().trim();
          if (val && val.length > 1 && val.length < 100) {
            console.log(`  ✅ ${label}: "${val}"`);
          }
        }
      }

      // Procura estilo Nike (XX-XXXXXX-XXX ou XXXXXX-XXX)
      const styleMatches = html.match(/([A-Z]{2}\d{4,6}-[A-Z]?\d{3,4})/g);
      if (styleMatches) {
        const unique = [...new Set(styleMatches)];
        console.log(`  🏷️  Possíveis style codes: ${unique.slice(0, 3).join(", ")}`);
      }

      // Procura EAN/UPC (13 ou 12 dígitos)
      const eanMatch = html.match(/[^>\d](\d{13})[^<\d]/);
      if (eanMatch) console.log(`  📦 EAN: ${eanMatch[1]}`);

    } catch (err: any) {
      console.log(`  ❌ ${err.message}`);
    }
  }
}

main();
