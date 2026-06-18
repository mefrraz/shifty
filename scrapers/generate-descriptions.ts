// generate-descriptions.ts
// Gera descrições IA para produtos sem descrição usando NVIDIA NIM
// Corre 1x/dia via GitHub Actions (fora das horas de scrape — 04:00 Lisboa)
// Uso: npx tsx scrapers/generate-descriptions.ts

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env") });

import { createServerClient } from "../lib/supabaseServer";
import { generateDescription } from "../lib/nvidia";

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  brand: string;
  player_type: string | null;
}

interface StoreDesc {
  store: string;
  description: string;
}

async function main() {
  console.log("=".repeat(60));
  console.log(`🧠 NVIDIA NIM — Gerar descrições IA`);
  console.log(`   Modelo: meta/llama-3.1-8b-instruct`);
  console.log(`   Início: ${new Date().toISOString()}`);
  console.log("=".repeat(60));

  const supabase = createServerClient();

  // 1. Busca produtos sem descrição (limite: 20 por run — free tier tem 40 req/min)
  const { data: products, error } = await supabase
    .from("products")
    .select("id, slug, name, brand, player_type")
    .is("description", null)
    .limit(20);

  if (error) {
    console.error(`❌ Erro ao buscar produtos: ${error.message}`);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log("✅ Todos os produtos já têm descrição!");
    process.exit(0);
  }

  console.log(`📦 ${products.length} produto(s) sem descrição\n`);

  let generated = 0;
  let failed = 0;

  for (const product of products as ProductRow[]) {
    console.log(`\n📝 ${product.brand} — ${product.name}`);

    try {
      // 2. Busca descrições das lojas (scraped das páginas de produto)
      const { data: prices } = await supabase
        .from("prices")
        .select("store, store_url")
        .eq("product_id", product.id)
        .eq("in_stock", true);

      const storeDescriptions: string[] = [];

      // Tenta fazer fetch da página de cada loja para extrair meta description
      if (prices) {
        for (const price of prices) {
          try {
            const response = await fetch(price.store_url, {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (compatible; Shifty/1.0; +https://shifty.pt)",
              },
              signal: AbortSignal.timeout(5000),
            });

            if (response.ok) {
              const html = await response.text();

              // Extrai meta description
              const metaMatch = html.match(
                /<meta[^>]+name="description"[^>]+content="([^"]+)"/
              );
              if (metaMatch) {
                storeDescriptions.push(metaMatch[1].trim());
              }

              // Fallback: og:description
              const ogMatch = html.match(
                /<meta[^>]+property="og:description"[^>]+content="([^"]+)"/
              );
              if (ogMatch && !storeDescriptions.includes(ogMatch[1].trim())) {
                storeDescriptions.push(ogMatch[1].trim());
              }
            }
          } catch {
            // ignora erros de fetch individuais
          }
        }
      }

      console.log(
        `   📄 ${storeDescriptions.length} descrição(ões) de lojas encontradas`
      );

      // 3. Gera descrição via NVIDIA NIM
      const description = await generateDescription({
        productName: product.name,
        brand: product.brand,
        storeDescriptions,
        playerType: product.player_type,
      });

      if (!description) {
        console.log(`   ⚠️  NVIDIA não retornou descrição`);
        failed++;
        continue;
      }

      console.log(`   ✅ "${description.slice(0, 80)}..."`);

      // 4. Guarda na BD
      const { error: updateError } = await supabase
        .from("products")
        .update({ description })
        .eq("id", product.id);

      if (updateError) {
        console.error(`   ❌ Erro ao guardar: ${updateError.message}`);
        failed++;
      } else {
        generated++;
      }

      // Rate limiting — free tier: 40 req/min ≈ 1.5s entre chamadas
      await new Promise((r) => setTimeout(r, 2000));
    } catch (err: any) {
      console.error(`   ❌ Erro: ${err.message}`);
      failed++;
    }
  }

  // Sumário
  console.log("\n" + "=".repeat(60));
  console.log("📊 SUMÁRIO");
  console.log("=".repeat(60));
  console.log(`✅ ${generated} descrições geradas`);
  console.log(`❌ ${failed} falhas`);
  console.log(`📦 ${products.length - generated - failed} pendentes`);
  console.log(`🏁 ${new Date().toISOString()}`);

  process.exit(failed > 0 && generated === 0 ? 1 : 0);
}

main();
