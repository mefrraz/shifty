import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env") });
import { createServerClient } from "../lib/supabaseServer";

async function main() {
const s = createServerClient();
const { data } = await s.from("products").select("slug,name,brand,description").not("description", "is", null).order("created_at", { ascending: false }).limit(25);
for (const p of data || []) {
  console.log(`\n🔗 /sapatilha/${p.slug}`);
  console.log(`   ${p.brand} — ${p.name}`);
  console.log(`   ${p.description?.substring(0, 100)}...`);
}}
main();
