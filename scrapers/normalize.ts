// normalize.ts — Funções de normalização de produtos
// Sem deduplicação cross-loja — cada scraper insere o seu preço;
// o Supabase agrupa por slug na tabela products.

/**
 * Mapeamento de palavras-chave → marca normalizada
 */
const BRAND_PATTERNS: Record<string, string> = {
  nike: "Nike",
  jordan: "Jordan",
  "air jordan": "Jordan",
  adidas: "Adidas",
  puma: "Puma",
  "under armour": "Under Armour",
  ua: "Under Armour",
  "new balance": "New Balance",
  reebok: "Reebok",
  converse: "Converse",
  anta: "Anta",
  "li-ning": "Li-Ning",
  lining: "Li-Ning",
  peak: "Peak",
  "way of wade": "Li-Ning",
};

/**
 * Deteta a marca a partir do nome do produto
 */
export function detectBrand(name: string): string {
  const lower = name.toLowerCase();
  for (const [pattern, brand] of Object.entries(BRAND_PATTERNS)) {
    if (lower.includes(pattern)) return brand;
  }
  return "Outra";
}

/**
 * Padroniza o nome da marca (para casos em que já sabemos a marca)
 */
export function normalizeBrand(brand: string): string {
  const lower = brand.trim().toLowerCase();
  for (const [pattern, normalized] of Object.entries(BRAND_PATTERNS)) {
    if (lower === pattern || lower.includes(pattern)) return normalized;
  }
  // Capitalizar
  return brand
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Extrai modelo e colorway do nome do produto
 * Ex: "Nike LeBron 22 White/Black" → { model: "LeBron 22", colorway: "White/Black" }
 */
export function parseProductName(
  name: string,
  brand: string
): { model: string; colorway: string | null } {
  let cleaned = name.trim();

  // Remove a marca do início se presente
  const brandLower = brand.toLowerCase();
  if (cleaned.toLowerCase().startsWith(brandLower)) {
    cleaned = cleaned.slice(brand.length).trim();
  }

  // Deteta colorway no final (padrões: "White/Black", "Branco/Preto", "Red Orbit")
  const colorwayPatterns = [
    /\s+([A-Za-zÀ-ÿ]+\/[A-Za-zÀ-ÿ]+)$/,        // "White/Black"
    /\s+\(([A-Za-zÀ-ÿ\s\/]+)\)$/,                // "(White/Black)"
    /\s+-\s+([A-Za-zÀ-ÿ\s]+)$/,                  // " - University Blue"
  ];

  let colorway: string | null = null;
  for (const pattern of colorwayPatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      colorway = match[1].trim();
      cleaned = cleaned.replace(pattern, "").trim();
      break;
    }
  }

  return { model: cleaned || name, colorway };
}

/**
 * Gera um slug único: marca-modelo-colorway
 * Ex: "nike-lebron-22-white-black"
 */
export function generateSlug(
  brand: string,
  model: string,
  colorway: string | null
): string {
  const parts = [brand, model];
  if (colorway) parts.push(colorway);
  return parts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9À-ÿ]+/g, "-") // substitui não-alfanuméricos por -
    .replace(/^-+|-+$/g, "")         // remove trailing/leading -
    .replace(/-{2,}/g, "-");         // colapsa múltiplos -
}

/**
 * Limpa e converte string de preço para número
 * Ex: "129,99 €" → 129.99, "€129.99" → 129.99
 */
export function cleanPrice(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw
    .replace(/[€$£\s]/g, "")
    .replace(/\./g, "")      // remove separador de milhar europeu
    .replace(/,/g, ".");     // vírgula → ponto decimal
  const num = parseFloat(cleaned);
  return isNaN(num) || num <= 0 ? null : num;
}

/**
 * Extrai tamanhos EU de texto
 * Ex: "42, 42.5, 43" → [{ size_eu: "42" }, { size_eu: "42.5" }, { size_eu: "43" }]
 */
export function extractSizes(text: string): { size_eu: string; size_us: string | null }[] {
  if (!text) return [];
  // Padrão europeu: 40-49 com .5 opcional
  const matches = text.match(/\b(3[5-9]|4[0-9]|5[0-2])(?:[.,]5)?\b/g);
  if (!matches) return [];
  return [...new Set(matches)] // deduplica
    .map((s) => ({
      size_eu: s.replace(",", "."),
      size_us: null, // US conversion pode ser adicionada depois
    }));
}

/**
 * Normaliza o texto para comparação (minúsculas, sem acentos, sem espaços extra)
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Gera tags automáticas a partir do nome/descrição
 */
export function generateTags(name: string, description?: string): string[] {
  const text = `${name} ${description || ""}`.toLowerCase();
  const tags: string[] = [];

  const tagMap: Record<string, string> = {
    "low-top": "low-top",
    "low top": "low-top",
    "mid-top": "mid-top",
    "mid top": "mid-top",
    "high-top": "high-top",
    "high top": "high-top",
    grip: "grip",
    tracção: "grip",
    tração: "grip",
    amortecimento: "cushioning",
    cushioning: "cushioning",
    cushion: "cushioning",
    "zoom air": "zoom-air",
    zoom: "zoom-air",
    air: "air",
    boost: "boost",
    flyease: "flyease",
    goretex: "gore-tex",
    "gore-tex": "gore-tex",
    waterproof: "waterproof",
    leve: "lightweight",
    lightweight: "lightweight",
    responsivo: "responsive",
    responsive: "responsive",
  };

  for (const [pattern, tag] of Object.entries(tagMap)) {
    if (text.includes(pattern) && !tags.includes(tag)) {
      tags.push(tag);
    }
  }

  // Player type inference
  if (text.includes("guard") || text.includes("base") || text.includes("armador")) {
    tags.push("guard");
  }
  if (text.includes("forward") || text.includes("ala") || text.includes("extremo")) {
    tags.push("forward");
  }
  if (text.includes("center") || text.includes("pivot") || text.includes("poste")) {
    tags.push("center");
  }

  return tags;
}
