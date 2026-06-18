import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env") });

import { createServerClient } from "../lib/supabaseServer";

const s = createServerClient();

async function main() {
  // Produtos com style_code
  const { count: scCount } = await s.from("products").select("*", { count: "exact", head: true }).not("style_code", "is", null);

  // Tamanhos
  const { count: szCount } = await s.from("size_availability").select("*", { count: "exact", head: true });
  const { data: szSample } = await s.from("size_availability").select("store, size_eu, in_stock").limit(5);

  // Cross-store
  const { data: prices } = await s.from("prices").select("product_id, store").limit(500);
  const m: Record<string, string[]> = {};
  if (prices) for (const p of prices) { if (!m[p.product_id]) m[p.product_id] = []; m[p.product_id].push(p.store); }
  const multi = Object.entries(m).filter(([_, v]) => v.length > 1);

  // Amostra de produtos com style_code
  const { data: sample } = await s.from("products").select("slug, name, style_code").not("style_code", "is", null).limit(5);

  console.log("Style codes:", scCount);
  console.log("Tamanhos total:", szCount);
  if (szSample) for (const z of szSample) console.log(`   ${z.store} | EU ${z.size_eu} | ${z.in_stock ? "✅" : "❌"}`);
  console.log("Cross-store merges:", multi.length);
  if (multi.length > 0) {
    for (const [pid, stores] of multi.slice(0, 3)) {
      const { data: prod } = await s.from("products").select("name").eq("id", pid).single();
      console.log(`   "${prod?.name}" → ${stores.join(" + ")}`);
    }
  } else {
    console.log("   ⚠️  Nenhum produto em múltiplas lojas");
  }
  console.log("\nAmostra com style_code:", sample?.length);
  if (sample) for (const p of sample) console.log(`   ${p.style_code} | ${p.name}`);
}

main();
