// NVIDIA NIM client — OpenAI-compatible
// Modelo: meta/llama-3.1-8b-instruct (gratuito no free tier)
// Custo: ~$0.01 por 1000 tokens

import OpenAI from "openai";

let _openai: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY!,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });
  }
  return _openai;
}

interface GenerateDescriptionParams {
  productName: string;
  brand: string;
  storeDescriptions: string[];
  playerType?: string | null;
}

/**
 * Gera uma descrição unificada em português a partir de descrições de várias lojas.
 * Máximo 120 palavras, inclui tecnologia, tipo de jogador e diferencial.
 */
export async function generateDescription({
  productName,
  brand,
  storeDescriptions,
  playerType,
}: GenerateDescriptionParams): Promise<string | null> {
  const descriptionsText =
    storeDescriptions.length > 0
      ? storeDescriptions
          .map((d, i) => `Loja ${i + 1}: ${d}`)
          .join("\n")
      : "Sem descrições das lojas disponíveis.";

  const playerContext =
    playerType === "guard"
      ? "Este modelo é ideal para bases e armadores — jogadores rápidos que precisam de tração e resposta rápida."
      : playerType === "forward"
        ? "Este modelo é ideal para extremos e alas — jogadores versáteis que precisam de suporte lateral e amortecimento balanceado."
        : playerType === "center"
          ? "Este modelo é ideal para postes e pivôs — jogadores pesados que precisam de amortecimento máximo e suporte de tornozelo."
          : "Adequado para vários tipos de jogador.";

  const prompt = `És um especialista em sapatilhas de basquetebol.
Com base nestas descrições de várias lojas:
${descriptionsText}

Gera uma descrição em português de 80-120 palavras para a sapatilha "${productName}" da ${brand}.
Inclui: tecnologia principal, tipo de jogo ideal, e ponto diferenciador.
${playerContext}
Responde apenas com a descrição, sem introdução, sem aspas.`;

  try {
    const completion = await getClient().chat.completions.create({
      model: "meta/llama-3.1-8b-instruct",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 300,
    });

    const description = completion.choices[0]?.message?.content?.trim();
    return description || null;
  } catch (err: any) {
    console.error(`  ❌ NVIDIA API: ${err.message}`);
    return null;
  }
}

/**
 * Gera descrição a partir apenas do nome/produto (fallback sem descrições de lojas)
 */
export async function generateDescriptionFromName(
  productName: string,
  brand: string
): Promise<string | null> {
  return generateDescription({
    productName,
    brand,
    storeDescriptions: [],
    playerType: null,
  });
}
