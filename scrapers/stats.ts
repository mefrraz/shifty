// stats.ts — Estatísticas da base de dados
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env") });

import { createServerClient } from "../lib/supabaseServer";

const supabase = createServerClient();

async function main() {
  // Produtos
  const { count: totalProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });

  // Com descrição
  const { count: withDesc } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .not("description", "is", null);

  // Lojas distintas com preços
  const { data: stores } = await supabase
    .from("prices")
    .select("store");

  const uniqueStores = stores ? [...new Set(stores.map((s) => s.store))] : [];

  // Preços por loja
  const storeCounts: Record<string, number> = {};
  if (stores) {
    for (const s of stores) {
      storeCounts[s.store] = (storeCounts[s.store] || 0) + 1;
    }
  }

  // Marcas
  const { data: brands } = await supabase
    .from("products")
    .select("brand");

  const brandCounts: Record<string, number> = {};
  if (brands) {
    for (const b of brands) {
      brandCounts[b.brand] = (brandCounts[b.brand] || 0) + 1;
    }
  }

  // Produtos com preços
  const { count: withPrices } = await supabase
    .from("product_price_summary")
    .select("*", { count: "exact", head: true });

  console.log("=".repeat(50));
  console.log("📊 ESTATÍSTICAS SHIFTY");
  console.log("=".repeat(50));
  console.log();
  console.log(`👟 Sapatilhas:        ${totalProducts ?? 0}`);
  console.log(`💰 Com preços:        ${withPrices ?? 0}`);
  console.log(`🧠 Com descrição IA:  ${withDesc ?? 0}`);
  console.log(`🏪 Lojas com dados:   ${uniqueStores.length}`);
  console.log();

  console.log("--- Lojas ---");
  for (const [store, count] of Object.entries(storeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${store.padEnd(20)} ${count} produtos`);
  }
  console.log();

  console.log("--- Marcas ---");
  for (const [brand, count] of Object.entries(brandCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${brand.padEnd(20)} ${count} produtos`);
  }
}

main();
