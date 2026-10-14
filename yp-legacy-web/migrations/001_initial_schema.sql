-- Migration 001: Initial Schema for IEEE YP Green Legacy Project
-- Targets: Neon Serverless PostgreSQL / Lakebase Postgres
-- Strictly Non-Destructive & Backwards-Compatible with Existing Data

-- Migration tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid(),
  email TEXT PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  institution TEXT,
  ieee_id TEXT,
  membership_grade TEXT,
  region TEXT,
  section TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ensure backwards-compatibility for existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS institution TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ieee_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_grade TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Trees table
CREATE TABLE IF NOT EXISTS trees (
  id TEXT PRIMARY KEY,
  submission_key TEXT UNIQUE,
  species TEXT NOT NULL,
  common_name TEXT,
  botanical_name TEXT,
  image_url TEXT,
  images JSONB,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION NOT NULL DEFAULT 5.0,
  altitude DOUBLE PRECISION DEFAULT 0,
  gps_source TEXT NOT NULL DEFAULT 'SMARTPHONE_GPS',
  location_confidence INT NOT NULL DEFAULT 85,
  location_status TEXT NOT NULL DEFAULT 'HIGH',
  reading_count INT NOT NULL DEFAULT 1,
  stability_score INT NOT NULL DEFAULT 80,
  gps_stability TEXT DEFAULT 'STABLE',
  captured_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_of_planting TEXT,
  updated_at TEXT,
  student TEXT,
  college TEXT,
  cluster TEXT,
  institution TEXT,
  user_id TEXT,
  verification_status TEXT NOT NULL DEFAULT 'PENDING',
  verified_by TEXT,
  verification_date TEXT,
  identification_confidence INT DEFAULT 90,
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ensure backwards-compatibility for existing trees table
ALTER TABLE trees ADD COLUMN IF NOT EXISTS submission_key TEXT;
ALTER TABLE trees ADD COLUMN IF NOT EXISTS images JSONB;
ALTER TABLE trees ADD COLUMN IF NOT EXISTS location_confidence INT DEFAULT 85;
ALTER TABLE trees ADD COLUMN IF NOT EXISTS location_status TEXT DEFAULT 'HIGH';
ALTER TABLE trees ADD COLUMN IF NOT EXISTS reading_count INT DEFAULT 1;
ALTER TABLE trees ADD COLUMN IF NOT EXISTS stability_score INT DEFAULT 80;
ALTER TABLE trees ADD COLUMN IF NOT EXISTS gps_stability TEXT DEFAULT 'STABLE';
ALTER TABLE trees ADD COLUMN IF NOT EXISTS admin_note TEXT;
ALTER TABLE trees ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'PENDING';
ALTER TABLE trees ADD COLUMN IF NOT EXISTS verified_by TEXT;
ALTER TABLE trees ADD COLUMN IF NOT EXISTS verification_date TEXT;
ALTER TABLE trees ADD COLUMN IF NOT EXISTS identification_confidence INT DEFAULT 90;
ALTER TABLE trees ADD COLUMN IF NOT EXISTS date_of_planting TEXT;
ALTER TABLE trees ADD COLUMN IF NOT EXISTS student TEXT;
ALTER TABLE trees ADD COLUMN IF NOT EXISTS college TEXT;
ALTER TABLE trees ADD COLUMN IF NOT EXISTS cluster TEXT;
ALTER TABLE trees ADD COLUMN IF NOT EXISTS institution TEXT;
ALTER TABLE trees ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Tree Photos Table
CREATE TABLE IF NOT EXISTS tree_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id TEXT NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  storage_provider TEXT NOT NULL DEFAULT 'google_drive',
  storage_file_id TEXT NOT NULL,
  photo_role TEXT NOT NULL DEFAULT 'primary',
  mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
  file_size INT NOT NULL DEFAULT 0,
  uploader_id TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  upload_status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- OTP Tokens Table
CREATE TABLE IF NOT EXISTS otps (
  email TEXT PRIMARY KEY,
  otp_code TEXT NOT NULL,
  name TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- High-performance indexes for large scale (500,000 - 1,000,000 trees)
CREATE INDEX IF NOT EXISTS idx_trees_location ON trees(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_trees_user_id ON trees(user_id);
CREATE INDEX IF NOT EXISTS idx_trees_verification_status ON trees(verification_status);
CREATE INDEX IF NOT EXISTS idx_trees_captured_at ON trees(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_trees_species ON trees(species);
CREATE INDEX IF NOT EXISTS idx_trees_submission_key ON trees(submission_key);
CREATE INDEX IF NOT EXISTS idx_tree_photos_tree_id ON tree_photos(tree_id);
CREATE INDEX IF NOT EXISTS idx_tree_photos_public ON tree_photos(is_public);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
