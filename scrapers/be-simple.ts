import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env") });
import { createServerClient } from "../lib/supabaseServer";
import { getProductUrlsFromSitemap } from "./sitemap";
import { normalizeBrand, parseProductName, generateSlug, cleanPrice, isBasketballShoe } from "./normalize";
import * as cheerio from "cheerio";

const STORE = "basketballemotion";
const BASE = "https://www.basketballemotion.com";
const s = createServerClient();

async function main() {
  // BE via sitemap (sem recursão profunda — só 1 nível)
  console.log("BE: a obter URLs do sitemap...");
  try {
    const r = await fetch(`${BASE}/pt/sitemap.xml`, { headers: {"User-Agent":"Shifty/1.0"} });
    if (!r.ok) { console.log(`Sitemap HTTP ${r.status}`); return; }
    const xml = await r.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    // Pega sub-sitemaps
    const subLocs = $("sitemap > loc").map((_,el) => $(el).text().trim()).get();
    console.log(`  ${subLocs.length} sub-sitemaps`);

    // Pega só o primeiro sub-sitemap (produtos)
    let allUrls: string[] = [];
    for (const loc of subLocs.slice(0, 3)) {
      try {
        const sr = await fetch(loc, { headers: {"User-Agent":"Shifty/1.0"}, signal: AbortSignal.timeout(5000) });
        if (!sr.ok) continue;
        const sxml = await sr.text();
        const s$ = cheerio.load(sxml, { xmlMode: true });
        // Pode ser outro índice
        const subSub = s$("sitemap > loc").map((_,el) => s$(el).text().trim()).get();
        if (subSub.length > 0) {
          for (const ssl of subSub.slice(0, 2)) {
            try {
              const ssr = await fetch(ssl, { headers: {"User-Agent":"Shifty/1.0"}, signal: AbortSignal.timeout(5000) });
              if (!ssr.ok) continue;
              const ssxml = await ssr.text();
              const ss$ = cheerio.load(ssxml, { xmlMode: true });
              ss$("url > loc").each((_,el) => {
                const u = ss$(el).text().trim();
                if (u.includes("/pt/") && u.includes("sapatilha")) allUrls.push(u);
              });
            } catch {}
          }
        } else {
          s$("url > loc").each((_,el) => {
            const u = s$(el).text().trim();
            if (u.includes("/pt/") && u.includes("sapatilha")) allUrls.push(u);
          });
        }
      } catch {}
      if (allUrls.length > 0) break;
    }

    console.log(`  ${allUrls.length} URLs de produto`);
    let done = 0;
    for (const url of allUrls.slice(0, 50)) {
      try {
        const pr = await fetch(url, { headers: {"User-Agent":"Mozilla/5.0 Shifty/1.0"}, signal: AbortSignal.timeout(8000) });
        if (!pr.ok) continue;
        const html = await pr.text();
        const $p = cheerio.load(html);

        const name = $p("h1").first().text().trim() || $p('meta[property="og:title"]').attr("content") || "";
        if (!name || !isBasketballShoe(name)) continue;

        // Style code
        let sc: string|null = null;
        const refM = html.match(/ref\.?\s*fornecedor:?\s*([A-Z0-9]+[-_]?[A-Z0-9]*)/i);
        if (refM) sc = refM[1].replace(/_/g,"-");

        // Preço
        const priceText = $p('[itemprop="price"]').attr("content") || $p(".price").first().text().trim();
        const price = cleanPrice(priceText) || 0;
        const origText = $p(".old-price, .regular-price").first().text().trim();
        const origPrice = cleanPrice(origText) || null;

        // Imagem
        const img = $p('meta[property="og:image"]').attr("content") || null;

        // Tamanhos
        const sizes: {size_eu:string,in_stock:boolean}[] = [];
        const bodyText = $p("body").text();
        const sizeMatches = bodyText.match(/(\d{2}(?:[.,]\d{1,2})?)\s*(?:EU|EUR)/gi);
        if (sizeMatches) {
          for (const sm of sizeMatches) {
            const num = sm.match(/(\d{2}(?:[.,]\d{1,2})?)/);
            if (num && !sizes.some(s=>s.size_eu===num[1].replace(",","."))) {
              sizes.push({size_eu: num[1].replace(",","."), in_stock: true});
            }
          }
        }

        const brand = normalizeBrand(name);
        const {model, colorway} = parseProductName(name, brand);
        const slug = generateSlug(brand, model, colorway);
        if (!price) continue;

        const upsertData: any = {slug, name: name.trim(), brand, model, colorway, image_url: img};
        if (sc) upsertData.style_code = sc;

        let pid: string;
        if (sc) {
          const {data: ex} = await s.from("products").select("id").eq("style_code", sc).maybeSingle();
          if (ex) { pid = ex.id; await s.from("products").update(upsertData).eq("id", pid); }
          else {
            const {data: cr, error: ce} = await s.from("products").insert(upsertData).select("id").single();
            if (ce) continue;
            pid = cr.id;
          }
        } else {
          const {data: up, error: ue} = await s.from("products").upsert(upsertData,{onConflict:"slug"}).select("id").single();
          if (ue) continue;
          pid = up.id;
        }

        await s.from("prices").upsert({product_id:pid, store:STORE, store_url:url, current_price:price, original_price:origPrice, in_stock:true},{onConflict:"product_id,store"});

        if (sizes.length > 0) {
          await s.from("size_availability").delete().eq("product_id",pid).eq("store",STORE);
          await s.from("size_availability").insert(sizes.map(sz=>({product_id:pid, store:STORE, size_eu:sz.size_eu, in_stock:sz.in_stock})));
        }

        done++;
      } catch {}
    }
    console.log(`  ✅ ${done} produtos inseridos`);
  } catch(e:any) { console.log(`❌ ${e.message}`); }
}
main();
