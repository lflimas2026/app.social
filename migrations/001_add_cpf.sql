-- 001_add_cpf.sql
-- Migration: add cpf column to users table for Asaas customer requirement
-- Note: Cloudflare D1 (SQLite) supports ALTER TABLE ADD COLUMN

BEGIN TRANSACTION;
ALTER TABLE users ADD COLUMN cpf TEXT;
COMMIT;

-- If your D1 instance already has the column this will error; run a check before applying.