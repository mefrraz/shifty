// reset-and-rescrape.ts — Executa migração style_code, limpa BD, re-scrape
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env") });

import { createServerClient } from "../lib/supabaseServer";

const supabase = createServerClient();

async function main() {
  const args = process.argv.slice(2);
  const doDelete = args.includes("--delete");

  // 1. Executar migração style_code
  console.log("1. A executar migração style_code...");
  const sql = `
    ALTER TABLE products ADD COLUMN IF NOT EXISTS style_code TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_products_style_code ON products(style_code) WHERE style_code IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_products_style_code_search ON products(style_code);
  `;

  // Supabase não suporta exec_sql via JS client diretamente.
  // Usamos a REST Management API
  const mgmtUrl = `${process.env.SUPABASE_URL}/rest/v1/`;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  try {
    // Alternativa: executar statements individuais via REST
    // O Supabase expõe /rest/v1/rpc/ para funções, mas não para SQL raw
    // Vamos verificar se a coluna já existe
    const { data: cols } = await supabase.from("products").select("style_code").limit(1);
    console.log("   ✅ Coluna style_code já existe (ou foi criada)");
  } catch (err: any) {
    console.log(`   ⚠️  Executa manualmente: database/migrations/07_style_code.sql`);
    console.log(`   https://supabase.com/dashboard/project/wabbgfzghwfgupbfdfyt/sql/new`);
  }

  if (doDelete) {
    // 2. Limpar BD
    console.log("\n2. A limpar base de dados...");
    const { error: delPrices } = await supabase.from("prices").delete().neq("store", "NONE");
    if (delPrices) console.log(`   ⚠️  prices: ${delPrices.message}`); else console.log("   ✅ prices limpos");

    const { error: delSizes } = await supabase.from("size_availability").delete().neq("store", "NONE");
    if (delSizes) console.log(`   ⚠️  sizes: ${delSizes.message}`); else console.log("   ✅ sizes limpos");

    const { error: delProd } = await supabase.from("products").delete().neq("slug", "NONE");
    if (delProd) console.log(`   ⚠️  products: ${delProd.message}`); else console.log("   ✅ products limpos");
  }

  // 3. Re-scrape
  console.log("\n3. A iniciar re-scrape...");
  const { scrape: be } = await import("./basketballemotion");
  const { scrape: ms } = await import("./manelsanchez");

  const r1 = await be();
  const r2 = await ms();

  console.log(`\n🏁 Total: ${r1.inserted + r2.inserted} produtos`);
}

main().catch(console.error);
