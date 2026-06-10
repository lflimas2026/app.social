-- schema.sql
-- Cloudflare D1 Database schema for Social App

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS automations;
DROP TABLE IF EXISTS campaigns;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS connected_accounts;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS user_features;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS asaas_webhook_events;
DROP TABLE IF EXISTS users;

-- 1. Users Table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  theme TEXT DEFAULT 'dark',
  plan TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  subscription_id TEXT,
  asaas_customer_id TEXT,
  payment_status TEXT,
  last_payment_date TEXT,
  next_due_date TEXT,
  is_admin INTEGER DEFAULT 0, -- 0 = false, 1 = true
  is_blocked INTEGER DEFAULT 0, -- 0 = false, 1 = true
  created_at TEXT NOT NULL
);

-- 2. User Features Table
CREATE TABLE user_features (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  social_networks_limit INTEGER NOT NULL,
  schedulings_limit INTEGER NOT NULL,
  auto_posting INTEGER NOT NULL, -- 0 = false, 1 = true
  ads_manager INTEGER NOT NULL,
  ai_optimization INTEGER NOT NULL,
  gemini_integration INTEGER NOT NULL,
  exportable_reports INTEGER NOT NULL
);

-- 3. Connected Accounts Table
CREATE TABLE connected_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_id TEXT NOT NULL,
  account_avatar TEXT,
  is_active INTEGER DEFAULT 1,
  last_synced TEXT,
  created_at TEXT NOT NULL
);

-- 4. Posts Table
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT NOT NULL, -- JSON array of strings
  hashtags TEXT,
  scheduled_at TEXT NOT NULL,
  published_at TEXT,
  platforms TEXT NOT NULL, -- JSON array of strings (e.g. ["instagram"])
  status TEXT NOT NULL, -- draft, scheduled, published, failed
  preview_text TEXT NOT NULL,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagement_rate REAL DEFAULT 0.0,
  created_at TEXT NOT NULL
);

-- 5. Campaigns Table
CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT NOT NULL, -- meta_ads, tiktok_ads
  objective TEXT NOT NULL, -- traffic, conversions, awareness
  status TEXT NOT NULL, -- active, paused, completed, failed
  budget REAL NOT NULL,
  spent REAL DEFAULT 0.0,
  start_date TEXT NOT NULL,
  end_date TEXT,
  audience_age_min INTEGER NOT NULL,
  audience_age_max INTEGER NOT NULL,
  audience_location TEXT NOT NULL, -- JSON array of strings
  creative_text TEXT NOT NULL,
  creative_image_url TEXT,
  cta_button_text TEXT NOT NULL,
  landing_url TEXT NOT NULL,
  campaign_external_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  conversions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  cpc REAL DEFAULT 0.0,
  cpm REAL DEFAULT 0.0,
  roas REAL DEFAULT 0.0
);

-- 6. Automations Table
CREATE TABLE automations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  trigger_condition TEXT NOT NULL,
  action TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL
);

-- 7. Notifications Table
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

-- 8. Audit Logs Table
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  old_value TEXT, -- JSON string representation
  new_value TEXT, -- JSON string representation
  created_at TEXT NOT NULL
);

-- 9. Invoices Table
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL -- Pago, Pendente, Vencido
);

-- 10. Subscriptions Table
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asaas_subscription_id TEXT,
  plan_name TEXT,
  billing_type TEXT,
  amount REAL,
  status TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 11. Payments Table
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asaas_payment_id TEXT,
  subscription_id TEXT REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount REAL,
  billing_type TEXT,
  status TEXT,
  invoice_url TEXT,
  pix_copy_paste TEXT,
  paid_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 12. Asaas Webhook Events Table
CREATE TABLE asaas_webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- --- SEED DATA ---

-- 1. Seed Users
-- Admin
INSERT INTO users (id, email, first_name, last_name, company_name, avatar_url, timezone, theme, plan, subscription_status, next_due_date, is_admin, is_blocked, created_at)
VALUES (
  'usr_admin',
  'lflimas2022@gmail.com',
  'Luiz Fernando',
  'Lima',
  'Social SaaS',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&h=120&q=80',
  'America/Sao_Paulo',
  'dark',
  'professional',
  'active',
  NULL,
  1,
  0,
  '2026-06-10T10:00:00Z'
);

-- Professional User
INSERT INTO users (id, email, first_name, last_name, company_name, avatar_url, timezone, theme, plan, subscription_status, next_due_date, is_admin, is_blocked, created_at)
VALUES (
  'usr_f1293',
  'fernando@runtime.ia.br',
  'Luiz Fernando',
  'Lima',
  'Runtime IA',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
  'America/Sao_Paulo',
  'dark',
  'professional',
  'active',
  '2026-07-15',
  0,
  0,
  '2026-06-10T10:00:00Z'
);

-- Free User
INSERT INTO users (id, email, first_name, last_name, company_name, avatar_url, timezone, theme, plan, subscription_status, next_due_date, is_admin, is_blocked, created_at)
VALUES (
  'usr_free',
  'free@test.com',
  'Criador',
  'Iniciante',
  'Empresa Teste Free',
  NULL,
  'America/Sao_Paulo',
  'light',
  'free',
  'active',
  NULL,
  0,
  0,
  '2026-06-10T10:00:00Z'
);

-- Starter User
INSERT INTO users (id, email, first_name, last_name, company_name, avatar_url, timezone, theme, plan, subscription_status, next_due_date, is_admin, is_blocked, created_at)
VALUES (
  'usr_starter',
  'starter@test.com',
  'Negócio',
  'Local',
  'Empresa Teste Starter',
  NULL,
  'America/Sao_Paulo',
  'dark',
  'starter',
  'active',
  '2026-07-10',
  0,
  0,
  '2026-06-10T10:00:00Z'
);

-- 2. Seed User Features
-- usr_admin (Professional)
INSERT INTO user_features (user_id, social_networks_limit, schedulings_limit, auto_posting, ads_manager, ai_optimization, gemini_integration, exportable_reports)
VALUES ('usr_admin', 6, 999999, 1, 1, 1, 1, 1);

-- usr_f1293 (Professional)
INSERT INTO user_features (user_id, social_networks_limit, schedulings_limit, auto_posting, ads_manager, ai_optimization, gemini_integration, exportable_reports)
VALUES ('usr_f1293', 6, 999999, 1, 1, 1, 1, 1);

-- usr_free (Free)
INSERT INTO user_features (user_id, social_networks_limit, schedulings_limit, auto_posting, ads_manager, ai_optimization, gemini_integration, exportable_reports)
VALUES ('usr_free', 1, 10, 0, 0, 0, 0, 0);

-- usr_starter (Starter)
INSERT INTO user_features (user_id, social_networks_limit, schedulings_limit, auto_posting, ads_manager, ai_optimization, gemini_integration, exportable_reports)
VALUES ('usr_starter', 3, 999999, 1, 1, 1, 0, 0);


-- 3. Seed Connected Accounts
-- accounts for usr_f1293
INSERT INTO connected_accounts (id, user_id, platform, account_name, account_id, account_avatar, is_active, last_synced, created_at)
VALUES ('acc_f1', 'usr_f1293', 'instagram', '@suabrand', 'ig_1029', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&h=80&q=80', 1, '2026-06-10T10:00:00Z', '2026-06-10T10:00:00Z');
INSERT INTO connected_accounts (id, user_id, platform, account_name, account_id, account_avatar, is_active, last_synced, created_at)
VALUES ('acc_f2', 'usr_f1293', 'tiktok', 'suabrand_oficial', 'tt_3920', 'https://images.unsplash.com/photo-1618005198143-e5283b519a7f?auto=format&fit=crop&w=80&h=80&q=80', 1, '2026-06-10T10:00:00Z', '2026-06-10T10:00:00Z');
INSERT INTO connected_accounts (id, user_id, platform, account_name, account_id, account_avatar, is_active, last_synced, created_at)
VALUES ('acc_f3', 'usr_f1293', 'meta_ads', 'Meta Business - Brand Inc', 'meta_ads_9921', NULL, 1, '2026-06-10T10:00:00Z', '2026-06-10T10:00:00Z');

-- accounts for usr_admin
INSERT INTO connected_accounts (id, user_id, platform, account_name, account_id, account_avatar, is_active, last_synced, created_at)
VALUES ('acc_a1', 'usr_admin', 'instagram', '@saas_admin', 'ig_admin_01', NULL, 1, '2026-06-10T10:00:00Z', '2026-06-10T10:00:00Z');


-- 4. Seed Posts
-- posts for usr_f1293
INSERT INTO posts (id, user_id, content, media_urls, hashtags, scheduled_at, published_at, platforms, status, preview_text, impressions, reach, likes, comments, shares, saves, clicks, engagement_rate, created_at)
VALUES (
  'post_f1',
  'usr_f1293',
  'Confira os bastidores do desenvolvimento do nosso novo produto! Cada detalhe foi pensado para simplificar a sua rotina de marketing digital. 🚀✨',
  '["https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80"]',
  'marketing,bastidores,produtividade,digital',
  '2026-06-09T22:00:00Z',
  '2026-06-09T22:00:00Z',
  '["instagram"]',
  'published',
  'Confira os bastidores do desenvolvimento...',
  4210,
  3820,
  342,
  29,
  14,
  42,
  112,
  9.8,
  '2026-06-09T10:00:00Z'
);

INSERT INTO posts (id, user_id, content, media_urls, hashtags, scheduled_at, published_at, platforms, status, preview_text, impressions, reach, likes, comments, shares, saves, clicks, engagement_rate, created_at)
VALUES (
  'post_f2',
  'usr_f1293',
  'Como as automações inteligentes podem economizar tempo e focar nos resultados? Nosso novo painel está no ar!',
  '[]',
  'dicas,redessociais,marketingdeconteudo',
  '2026-06-10T20:00:00Z',
  NULL,
  '["instagram"]',
  'scheduled',
  'Como as automações inteligentes...',
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0.0,
  '2026-06-10T10:00:00Z'
);


-- 5. Seed Campaigns
-- campaign for usr_f1293
INSERT INTO campaigns (id, user_id, name, platform, objective, status, budget, spent, start_date, end_date, audience_age_min, audience_age_max, audience_location, creative_text, creative_image_url, cta_button_text, landing_url, campaign_external_id, created_at, conversions, clicks, impressions, reach, cpc, cpm, roas)
VALUES (
  'camp_f1',
  'usr_f1293',
  'Campanha Outlet Verão',
  'meta_ads',
  'conversions',
  'active',
  350.00,
  240.00,
  '2026-06-01',
  '2026-06-25',
  22,
  45,
  '["São Paulo, SP", "Rio de Janeiro, RJ"]',
  'Descontos imperdíveis de verão! Clique e garanta o seu.',
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=400&q=80',
  'Comprar Agora',
  'https://suabrand.com/outlet',
  'cmp_meta_99182',
  '2026-06-10T10:00:00Z',
  85,
  1420,
  28900,
  24200,
  0.17,
  8.30,
  2.45
);


-- 6. Seed Automations
-- automation for usr_f1293
INSERT INTO automations (id, user_id, name, type, trigger_condition, action, is_active, created_at)
VALUES (
  'auto_f1',
  'usr_f1293',
  'Pausar campanhas com ROAS baixo',
  'auto_pause_low_roas',
  'roas < 1.2',
  'pause_campaign',
  1,
  '2026-06-10T10:00:00Z'
);


-- 7. Seed Notifications
-- notification for usr_f1293
INSERT INTO notifications (id, user_id, type, title, message, related_id, is_read, created_at)
VALUES (
  'notif_f1',
  'usr_f1293',
  'post_published',
  'Post publicado com sucesso!',
  'Seu post "Confira os bastidores..." foi publicado no Instagram.',
  'post_f1',
  0,
  '2026-06-09T22:00:00Z'
);


-- 8. Seed Audit Logs
-- audit log for usr_f1293
INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, old_value, new_value, created_at)
VALUES (
  'audit_f1',
  'usr_f1293',
  'Conectou conta do Instagram @suabrand',
  'account',
  'acc_f1',
  NULL,
  '{"id":"acc_f1","user_id":"usr_f1293","platform":"instagram","account_name":"@suabrand","account_id":"ig_1029"}',
  '2026-06-05T10:00:00Z'
);


-- 9. Seed Invoices
-- invoices for usr_f1293
INSERT INTO invoices (id, user_id, date, plan_name, amount, payment_method, status)
VALUES (
  '#INV-9824',
  'usr_f1293',
  '2026-06-01',
  'Plano Pro',
  149.00,
  'pix',
  'Pago'
);
