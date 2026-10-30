-- Runs once, on first container start.
-- The postgis image already enables PostGIS in the default database (city_reporter).
CREATE DATABASE city_reporter_test;
\connect city_reporter_test
CREATE EXTENSION IF NOT EXISTS postgis;
