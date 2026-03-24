-- V3: seed initial data
INSERT INTO notes (title, body, priority) VALUES
  ('Learn @alt-javascript/boot',   'Read the docs and examples.',                    1),
  ('Try Flyway migrations',        'Versioned SQL files in db/migration/.',           2),
  ('Explore multi-db deployments', 'See example-5-4 for two datasources + Flyway.',  3);
