-- 01_products.sql
-- Catálogo normalizado — uma linha por sapatilha única

CREATE TABLE IF NOT EXISTS products (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  brand         TEXT NOT NULL,
  model         TEXT,
  colorway      TEXT,
  image_url     TEXT,
  description   TEXT,
  player_type   TEXT CHECK (player_type IN ('guard', 'forward', 'center', 'all')),
  player_level  TEXT CHECK (player_level IN ('beginner', 'intermediate', 'pro')),
  tags          TEXT[],
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_player_type ON products(player_type);
CREATE INDEX IF NOT EXISTS idx_products_player_level ON products(player_level);
