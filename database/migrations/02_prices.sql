-- 02_prices.sql
-- Preços por loja — uma linha por produto+loja (UPSERT)
-- Histórico completo, só a linha mais recente é considerada ativa

CREATE TABLE IF NOT EXISTS prices (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store           TEXT NOT NULL,
  store_url       TEXT NOT NULL,
  current_price   DECIMAL(10,2) NOT NULL,
  original_price  DECIMAL(10,2),
  currency        CHAR(3) DEFAULT 'EUR',
  in_stock        BOOLEAN DEFAULT TRUE,
  scraped_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, store)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_prices_product ON prices(product_id);
CREATE INDEX IF NOT EXISTS idx_prices_store ON prices(store);
CREATE INDEX IF NOT EXISTS idx_prices_in_stock ON prices(in_stock);
