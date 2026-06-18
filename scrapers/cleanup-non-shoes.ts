// cleanup-non-shoes.ts — Remove produtos que não são sapatilhas
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env") });

import { createServerClient } from "../lib/supabaseServer";
import { isBasketballShoe } from "./normalize";

const supabase = createServerClient();

async function main() {
  // Busca todos os produtos
  const { data: products, error } = await supabase.from("products").select("id, name, brand");
  if (error) { console.error(error); process.exit(1); }
  if (!products) { console.log("Sem produtos."); process.exit(0); }

  const nonShoes = products.filter(p => !isBasketballShoe(p.name));

  console.log(`Total: ${products.length} | Sapatilhas: ${products.length - nonShoes.length} | Não-sapatilhas: ${nonShoes.length}\n`);

  if (nonShoes.length === 0) { console.log("✅ Tudo limpo!"); process.exit(0); }

  // Mostra os que vão ser removidos
  for (const p of nonShoes.slice(0, 20)) {
    console.log(`  🗑️  ${p.brand} — ${p.name}`);
  }
  if (nonShoes.length > 20) console.log(`  ... e mais ${nonShoes.length - 20}`);

  // Apaga (CASCADE apaga prices e sizes também)
  const ids = nonShoes.map(p => p.id);
  const { error: delErr } = await supabase.from("products").delete().in("id", ids);
  if (delErr) { console.error(`❌ Erro ao apagar: ${delErr.message}`); process.exit(1); }

  console.log(`\n✅ ${nonShoes.length} produtos removidos.`);
}

main();
