-- Migration 002: Geospatial Optimization & Spatial Indexing for 500,000 - 1,000,000 Trees
-- Safe PostGIS extension check and GiST spatial indexing with compound B-tree fallback

-- Try to create PostGIS extension if available on Neon project
DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS postgis;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'PostGIS extension not available or restricted; proceeding with standard composite B-tree geographic indexing.';
  END;
END $$;

-- If PostGIS geometry exists, add location_geom column and GiST index
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'geometry') THEN
    ALTER TABLE trees ADD COLUMN IF NOT EXISTS location_geom GEOMETRY(Point, 4326);
    -- Populate geometry from existing coordinates
    UPDATE trees
    SET location_geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
    WHERE location_geom IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;
    -- Build GiST index for fast spatial queries (ST_DWithin, ST_MakeEnvelope)
    CREATE INDEX IF NOT EXISTS idx_trees_spatial_gist ON trees USING GIST (location_geom);
  END IF;
END $$;

-- High performance composite index for bounding box queries: WHERE latitude BETWEEN ... AND longitude BETWEEN ...
CREATE INDEX IF NOT EXISTS idx_trees_spatial_compound ON trees (latitude, longitude, captured_at DESC);
