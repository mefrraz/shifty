-- 07_style_code.sql
-- Adiciona style_code como chave universal de produto (SKU do fabricante)
-- Exemplos: IM5839-001 (Nike), KH9153 (Adidas), DX8733-007 (Jordan)

-- Adiciona coluna
ALTER TABLE products ADD COLUMN IF NOT EXISTS style_code TEXT;

-- Índice único (permite NULLs — produtos sem código não colidem)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_style_code ON products(style_code) WHERE style_code IS NOT NULL;

-- Índice para busca
CREATE INDEX IF NOT EXISTS idx_products_style_code_search ON products(style_code);
