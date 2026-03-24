-- example-5-2-persistence-jsdbc: seed data
-- Loaded automatically by SchemaInitializer after schema.sql.

INSERT INTO notes (title, body) VALUES
  ('Learn @alt-javascript/boot',      'Read the docs and examples.'),
  ('Try persistence with jsdbc',      'jsdbcTemplateStarter auto-wires the DataSource.'),
  ('Explore NamedParameterJsdbcTemplate', 'Use :param syntax for named placeholders.');
