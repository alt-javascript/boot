-- example-5-2-persistence-jsdbc: schema
-- Loaded automatically by SchemaInitializer on application start.
-- (boot.datasource.initialize defaults to true)

CREATE TABLE IF NOT EXISTS notes (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT    NOT NULL,
  body  TEXT,
  done  INTEGER NOT NULL DEFAULT 0
);
