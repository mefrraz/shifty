// re-slug.ts — Recalcula slugs de todos os produtos com a nova lógica de normalização
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env") });

import { createServerClient } from "../lib/supabaseServer";
import { parseProductName, generateSlug } from "./normalize";

const supabase = createServerClient();

async function main() {
  const { data: products, error } = await supabase.from("products").select("id, name, brand, model, colorway, slug");
  if (error || !products) { console.error(error); process.exit(1); }

  let updated = 0;
  let conflicts = 0;

  for (const p of products) {
    const { model, colorway: cw } = parseProductName(p.name, p.brand);
    const newSlug = generateSlug(p.brand, model || p.model || p.name, cw || p.colorway);

    if (newSlug !== p.slug) {
      // Verifica se já existe outro produto com este slug
      const { data: existing } = await supabase.from("products").select("id").eq("slug", newSlug).neq("id", p.id).maybeSingle();

      if (existing) {
        // Conflito — merge os preços para o produto existente
        console.log(`  🔀 Merge: "${p.name}" → slug "${newSlug}" já existe (id ${existing.id})`);

        // Move prices para o produto existente
        const { data: prices } = await supabase.from("prices").select("store, store_url, current_price, original_price, in_stock").eq("product_id", p.id);
        if (prices) {
          for (const pr of prices) {
            await supabase.from("prices").upsert({ ...pr, product_id: existing.id }, { onConflict: "product_id,store" });
          }
        }
        // Move sizes
        const { data: sizes } = await supabase.from("size_availability").select("store, size_eu, size_us, in_stock").eq("product_id", p.id);
        if (sizes) {
          for (const sz of sizes) {
            await supabase.from("size_availability").upsert({ ...sz, product_id: existing.id }, { onConflict: "product_id,store,size_eu" });
          }
        }
        // Apaga o duplicado
        await supabase.from("products").delete().eq("id", p.id);
        conflicts++;
      } else {
        // Só atualiza o slug
        await supabase.from("products").update({ slug: newSlug, model, colorway: cw }).eq("id", p.id);
        updated++;
        console.log(`  📝 ${p.slug} → ${newSlug}`);
      }
    }
  }

  console.log(`\n✅ ${updated} slugs atualizados, ${conflicts} produtos merged (cross-store match)`);
}

main();
