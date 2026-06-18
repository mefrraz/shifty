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
