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
