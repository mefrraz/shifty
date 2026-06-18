// sitemap.ts — Fetch e parse de sitemap.xml para obter URLs de produtos

import * as cheerio from "cheerio";

interface SitemapResult {
  urls: string[];
  source: "sitemap_index" | "sitemap" | "flat_sitemap" | "none";
}

/**
 * Tenta obter URLs de produto via sitemap.xml.
 * Suporta 3 formatos:
 * 1. <sitemapindex> com <sitemap><loc> — índice standard
 * 2. <urlset> com <url><loc> — sitemap direto
 * 3. <urlset> com <url><loc> apontando para outros sitemaps — formato não-standard (Manel Sanchez)
 */
export async function getProductUrlsFromSitemap(
  baseUrl: string,
  productUrlPattern?: RegExp
): Promise<SitemapResult> {
  const sitemapCandidates = [
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/pt/sitemap.xml`,
    `${baseUrl}/sitemap_articles.xml`,
    `${baseUrl}/sitemap_products.xml`,
  ];

  for (const sitemapUrl of sitemapCandidates) {
    try {
      const response = await fetch(sitemapUrl, {
        headers: { "User-Agent": "Shifty/1.0" },
      });

      if (!response.ok) continue;

      const xml = await response.text();
      const $ = cheerio.load(xml, { xmlMode: true });

      // Formato 1: sitemapindex standard
      const sitemapLocs = $("sitemap > loc")
        .map((_, el) => $(el).text().trim())
        .get();

      if (sitemapLocs.length > 0) {
        console.log(`    📁 Sitemap index com ${sitemapLocs.length} sitemaps`);
        const allUrls: string[] = [];

        for (const loc of sitemapLocs.slice(0, 20)) {
          try {
            const subResponse = await fetch(loc, {
              headers: { "User-Agent": "Shifty/1.0" },
            });
            if (subResponse.ok) {
              const subXml = await subResponse.text();
              const sub$ = cheerio.load(subXml, { xmlMode: true });

              // Pode ser sitemapindex recursivo (Basketball Emotion)
              const subSitemapLocs = sub$("sitemap > loc")
                .map((_, el) => sub$(el).text().trim())
                .get();

              if (subSitemapLocs.length > 0) {
                // Recursivo — vai um nível abaixo
                for (const subLoc of subSitemapLocs.slice(0, 10)) {
                  try {
                    const subSubResponse = await fetch(subLoc, {
                      headers: { "User-Agent": "Shifty/1.0" },
                    });
                    if (subSubResponse.ok) {
                      const subSubXml = await subSubResponse.text();
                      const subSub$ = cheerio.load(subSubXml, { xmlMode: true });
                      subSub$("url > loc").each((_, el) => {
                        const url = subSub$(el).text().trim();
                        if (url && (!productUrlPattern || productUrlPattern.test(url))) {
                          allUrls.push(url);
                        }
                      });
                    }
                  } catch { /* ignora */ }
                }
              } else {
                // Sitemap direto
                sub$("url > loc").each((_, el) => {
                  const url = sub$(el).text().trim();
                  if (url && (!productUrlPattern || productUrlPattern.test(url))) {
                    allUrls.push(url);
                  }
                });
              }
            }
          } catch { /* ignora */ }
        }

        if (allUrls.length > 0) {
          return { urls: allUrls, source: "sitemap_index" };
        }
      }

      // Formato 2 & 3: urlset — sitemap direto ou apontando para outros sitemaps
      const allLocs = $("url > loc")
        .map((_, el) => $(el).text().trim())
        .get();

      // Formato 3: se alguns URLs apontam para .xml, é um índice não-standard
      const xmlSubLinks = allLocs.filter((url) => url.endsWith(".xml"));
      if (xmlSubLinks.length > 0 && xmlSubLinks.length === allLocs.length) {
        console.log(`    📁 Índice não-standard com ${xmlSubLinks.length} sitemaps`);
        const allUrls: string[] = [];

        for (const loc of xmlSubLinks.slice(0, 20)) {
          try {
            const subResponse = await fetch(loc, {
              headers: { "User-Agent": "Shifty/1.0" },
            });
            if (subResponse.ok) {
              const subXml = await subResponse.text();
              const sub$ = cheerio.load(subXml, { xmlMode: true });
              sub$("url > loc").each((_, el) => {
                const url = sub$(el).text().trim();
                if (url && (!productUrlPattern || productUrlPattern.test(url))) {
                  allUrls.push(url);
                }
              });
            }
          } catch { /* ignora */ }
        }

        if (allUrls.length > 0) {
          return { urls: allUrls, source: "flat_sitemap" };
        }
      }

      // Formato 2: sitemap direto com URLs de produto
      const productUrls = allLocs.filter(
        (url) => !productUrlPattern || productUrlPattern.test(url)
      );

      if (productUrls.length > 0) {
        return { urls: productUrls, source: "sitemap" };
      }
    } catch {
      continue;
    }
  }

  return { urls: [], source: "none" };
}
