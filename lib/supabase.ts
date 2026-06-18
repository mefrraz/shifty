import { createBrowserClient } from "@supabase/ssr";

// Tipos da base de dados
export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  model: string | null;
  colorway: string | null;
  image_url: string | null;
  description: string | null;
  player_type: "guard" | "forward" | "center" | "all" | null;
  player_level: "beginner" | "intermediate" | "pro" | null;
  tags: string[] | null;
  created_at: string;
};

export type Price = {
  id: string;
  product_id: string;
  store: string;
  store_url: string;
  current_price: number;
  original_price: number | null;
  currency: string;
  in_stock: boolean;
  scraped_at: string;
};

export type SizeAvailability = {
  id: string;
  product_id: string;
  store: string;
  size_eu: string;
  size_us: string | null;
  in_stock: boolean;
  updated_at: string;
};

export type UserProfile = {
  id: string;
  username: string | null;
  position: "PG" | "SG" | "SF" | "PF" | "C" | null;
  level: "beginner" | "intermediate" | "pro" | null;
  play_style: string[] | null;
  foot_size_eu: string | null;
  created_at: string;
};

export type Wishlist = {
  id: string;
  user_id: string;
  product_id: string;
  alert_price: number | null;
  created_at: string;
};

export type ProductPriceSummary = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  image_url: string | null;
  max_price: number;
  min_price: number;
  savings_pct: number;
  last_updated: string;
};

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
