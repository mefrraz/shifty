-- 03_sizes.sql
-- Tamanhos disponíveis por loja

CREATE TABLE IF NOT EXISTS size_availability (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store         TEXT NOT NULL,
  size_eu       TEXT NOT NULL,
  size_us       TEXT,
  in_stock      BOOLEAN DEFAULT TRUE,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sizes_product ON size_availability(product_id);
CREATE INDEX IF NOT EXISTS idx_sizes_store ON size_availability(store);
CREATE INDEX IF NOT EXISTS idx_sizes_size_eu ON size_availability(size_eu);
