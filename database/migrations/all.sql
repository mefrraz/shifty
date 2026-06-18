-- 01_products.sql
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


-- 02_prices.sql
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


-- 03_sizes.sql
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


-- 04_user_profiles.sql
-- 04_user_profiles.sql
-- Perfil de jogador — ligado ao auth.users do Supabase

CREATE TABLE IF NOT EXISTS user_profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username      TEXT UNIQUE,
  position      TEXT CHECK (position IN ('PG', 'SG', 'SF', 'PF', 'C')),
  level         TEXT CHECK (level IN ('beginner', 'intermediate', 'pro')),
  play_style    TEXT[],
  foot_size_eu  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- RLS — cada utilizador vê/edit apenas o seu perfil
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);


-- 05_wishlists.sql
-- 05_wishlists.sql
-- Wishlist — sapatilhas guardadas com alerta de preço opcional

CREATE TABLE IF NOT EXISTS wishlists (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  alert_price   DECIMAL(10,2),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- RLS — cada utilizador gere a sua wishlist
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wishlist"
  ON wishlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into own wishlist"
  ON wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wishlist"
  ON wishlists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from own wishlist"
  ON wishlists FOR DELETE
  USING (auth.uid() = user_id);


-- 06_views.sql
-- 06_views.sql
-- Views úteis

-- Resumo de preços por produto (usado nas listagens)
CREATE OR REPLACE VIEW product_price_summary AS
SELECT
  p.id,
  p.slug,
  p.name,
  p.brand,
  p.image_url,
  p.player_type,
  p.player_level,
  p.tags,
  COALESCE(MAX(pr.original_price), MAX(pr.current_price)) AS max_price,
  MIN(pr.current_price) AS min_price,
  ROUND(
    ((COALESCE(MAX(pr.original_price), MAX(pr.current_price)) - MIN(pr.current_price))
    / NULLIF(COALESCE(MAX(pr.original_price), MAX(pr.current_price)), 0)) * 100
  ) AS savings_pct,
  COUNT(DISTINCT pr.store) AS store_count,
  MAX(pr.scraped_at) AS last_updated
FROM products p
JOIN prices pr ON pr.product_id = p.id
WHERE pr.in_stock = TRUE
GROUP BY p.id, p.slug, p.name, p.brand, p.image_url, p.player_type, p.player_level, p.tags;
