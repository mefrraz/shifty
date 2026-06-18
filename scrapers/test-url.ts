// Quick test to check HTML structure
async function main() {
  const url = process.argv[2] || "https://www.basket4ballers.com/pt/153-basketball";
  console.log("Fetching:", url);

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Shifty/1.0",
    },
  });

  console.log("Status:", res.status);
  const html = await res.text();

  // Check for product elements
  const patterns = [
    "product-miniature",
    "product-title",
    'class="price"',
    "product-container",
    "js-product",
    "article",
    "schema.org",
    "application/ld+json",
  ];

  for (const p of patterns) {
    const count = (html.match(new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "gi")) || []).length;
    console.log(`  ${p}: ${count}`);
  }

  // Show first 2000 chars
  console.log("\n--- First 2000 chars ---");
  console.log(html.substring(0, 2000));
}

main().catch(console.error);
