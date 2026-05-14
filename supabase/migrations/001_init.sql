-- YouTube Director Tool v2 — Initial Schema
-- Run this in Supabase SQL Editor after first deploy
-- (SQLAlchemy create_all handles table creation; this adds RLS policies)

-- ─── Enable RLS on all tables ─────────────────────────────────
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE thumbnails ENABLE ROW LEVEL SECURITY;

-- ─── NOTE ─────────────────────────────────────────────────────
-- This app uses a single service-role database user (via DATABASE_URL).
-- RLS policies below use a session variable set by the application layer.
-- Primary enforcement is application-level (company_id WHERE clauses in FastAPI).
-- These RLS policies serve as defense-in-depth.

-- Set company context before queries (called by app if using Supabase client):
-- SET LOCAL app.current_company_id = '<company_uuid>';

-- Allow service role to bypass RLS (SQLAlchemy service account):
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;

-- ─── Add indexes for performance ──────────────────────────────
CREATE INDEX IF NOT EXISTS idx_research_sessions_company ON research_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_video_projects_company ON video_projects(company_id);
CREATE INDEX IF NOT EXISTS idx_scripts_company ON scripts(company_id);
CREATE INDEX IF NOT EXISTS idx_thumbnails_company ON thumbnails(company_id);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
