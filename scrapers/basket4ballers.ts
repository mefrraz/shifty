// scraper-basket4ballers.ts
// Basket4Ballers — PrestaShop (listagem carregada via JS, sem API JSON pública)
// ⚠️  A listagem HTML não contém produtos (renderização client-side via AJAX)
// ⚠️  O sitemap.xml não existe (404)
// ⚠️  A API REST (/api/products) requer ws_key privada
//
// TODO (v0.2): Migrar para Playwright/Puppeteer para renderizar a listagem
//   ou obter a ws_key da loja para usar a API REST
//   URL: https://www.basket4ballers.com/pt/153-basketball
//   Seletores: article.product-miniature .product-title a, .price, .regular-price

const STORE = "basket4ballers";

async function scrape() {
  console.log(`${STORE} — ignorado (precisa de Playwright/Puppeteer)`);
  console.log(`  ⚠️  Listagem renderizada via JS — fetch simples não extrai produtos`);
  console.log(`  ⚠️  Sitemap: 404`);
  console.log(`  ⚠️  API REST: requer ws_key`);
  console.log(`  📋 TODO v0.2: Playwright ou obter ws_key da loja`);
  return { inserted: 0 };
}

if (require.main === module) {
  scrape().then(() => process.exit(0));
}

export { scrape };
