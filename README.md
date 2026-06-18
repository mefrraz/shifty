# shifty.pt

Agregador inteligente de sapatilhas de basquetebol para o mercado ibérico.

Compara preços em tempo real nas melhores lojas de Portugal e Espanha.

---

## Stack

| Camada | Tech |
|---|---|
| Frontend | Next.js 15 (App Router) |
| Estilos | Tailwind CSS |
| Auth | Supabase Auth |
| DB | Supabase PostgreSQL |
| Deploy | Vercel |
| Scrapers | Node.js + TypeScript + GitHub Actions |
| IA | NVIDIA NIM |

## Desenvolvimento

```bash
# Instalar
npm install

# Dev server
npm run dev

# Build
npm run build

# Scrapers (teste local)
npx tsx scrapers/run-all.ts
```

## Estrutura

```
app/              # Next.js App Router
  page.tsx        # Landing
  catalogo/       # Listagem de sapatilhas
  sapatilha/[slug]/  # Página de produto (SSR)
  marca/[slug]/   # Página de marca
  conta/          # Auth + perfil
components/       # Componentes React
lib/              # Supabase client, data layer
scrapers/         # Scrapers das lojas
database/         # Migrações SQL
```

## Lojas

| Loja | Estado |
|---|---|
| Manel Sanchez | 🟢 Funcional |
| Basketball Emotion | 🟢 Funcional |
| Basket4Ballers | 🔴 Bloqueado (precisa Playwright) |
| Nike PT | ⏳ v2 |
| BasketCountry | ⏳ v2 |
| BasketStore | ⏳ v2 |
| Planeta Basket | ⏳ v2 |

## Licença

Privado — todos os direitos reservados.
