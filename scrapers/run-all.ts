// run-all.ts — Orquestrador que executa todos os scrapers em sequência
// Chamado pelo GitHub Actions 3x/dia
// Uso: npx tsx scrapers/run-all.ts

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Carrega .env da raiz do projeto (shifty/)
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env") });

import { scrape as scrapeBasket4Ballers } from "./basket4ballers";
import { scrape as scrapeManelSanchez } from "./manelsanchez";
import { scrape as scrapeBasketballEmotion } from "./basketballemotion";

interface ScraperResult {
  store: string;
  status: "ok" | "error";
  inserted: number;
  error?: string;
  durationMs: number;
}

async function runAll() {
  console.log("=".repeat(60));
  console.log(`🚀 Shifty — Scrape iniciado às ${new Date().toISOString()}`);
  console.log("=".repeat(60));
  console.log();

  const results: ScraperResult[] = [];

  // Scrapers pela ordem de dificuldade (fáceis primeiro)
  const scrapers = [
    { name: "Basket4Ballers", fn: scrapeBasket4Ballers },
    { name: "Manel Sanchez", fn: scrapeManelSanchez },
    { name: "Basketball Emotion", fn: scrapeBasketballEmotion },
  ];

  for (const scraper of scrapers) {
    const start = Date.now();
    console.log(`\n▶️  ${scraper.name}`);
    console.log("-".repeat(40));

    try {
      const result = await scraper.fn();
      const duration = Date.now() - start;
      results.push({
        store: scraper.name,
        status: "ok",
        inserted: result.inserted,
        durationMs: duration,
      });
      console.log(`   ⏱️  ${(duration / 1000).toFixed(1)}s`);
    } catch (err: any) {
      const duration = Date.now() - start;
      results.push({
        store: scraper.name,
        status: "error",
        inserted: 0,
        error: err.message,
        durationMs: duration,
      });
      console.error(`   ❌ ${err.message}`);
    }
  }

  // Sumário
  console.log("\n" + "=".repeat(60));
  console.log("📊 SUMÁRIO");
  console.log("=".repeat(60));

  let totalInserted = 0;
  let totalErrors = 0;

  for (const r of results) {
    const icon = r.status === "ok" ? "✅" : "❌";
    console.log(
      `${icon} ${r.store.padEnd(20)} ${String(r.inserted).padStart(4)} produtos  ⏱️ ${(r.durationMs / 1000).toFixed(1)}s`
    );
    totalInserted += r.inserted;
    if (r.status === "error") totalErrors++;
  }

  console.log("-".repeat(40));
  console.log(`📦 Total: ${totalInserted} produtos inseridos/atualizados`);
  if (totalErrors > 0) {
    console.log(`⚠️  ${totalErrors} scrapers com erros`);
  }
  console.log(`🏁 Concluído às ${new Date().toISOString()}`);

  // Exit code para CI/CD
  if (totalErrors > 0 && totalInserted === 0) {
    // Todos falharam — provavelmente problema de rede/config
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error("💥 Erro fatal:", err);
  process.exit(1);
});
