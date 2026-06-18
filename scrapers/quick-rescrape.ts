import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env") });

import { createServerClient } from "../lib/supabaseServer";

const s = createServerClient();

async function main() {
  // Limpa via rpc ou delete em batch
  console.log("A limpar...");
  await s.from("size_availability").delete().neq("store", "___");
  await s.from("prices").delete().neq("store", "___");
  await s.from("products").delete().neq("slug", "___");
  console.log("Limpo!");

  // Scrape Basket Emotion
  const { scrape } = await import("./basketballemotion");
  await scrape();
}

main();
