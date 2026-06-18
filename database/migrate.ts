// Para executar as migrações:
// 1. Abre o SQL Editor do Supabase:
//    https://supabase.com/dashboard/project/wabbgfzghwfgupbfdfyt/sql/new
// 2. Cola o conteúdo de database/migrations/all.sql
// 3. Clica "Run"
//
// Ou executa com npx tsx database/migrate.ts
// (requer .env.local com SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY)

import { createServerClient } from "../lib/supabaseServer";
import * as fs from "fs";
import * as path from "path";

const supabase = createServerClient();

async function main() {
  const dir = path.join(__dirname, "migrations");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql") && f !== "all.sql")
    .sort();

  console.log(`🔧 ${files.length} migrações encontradas\n`);
  console.log(
    "⚠️  O Supabase JS client não executa SQL arbitrário diretamente."
  );
  console.log("📋 Abre o SQL Editor e cola database/migrations/all.sql\n");
  console.log(`🔗 https://supabase.com/dashboard/project/wabbgfzghwfgupbfdfyt/sql/new`);
}

main();
