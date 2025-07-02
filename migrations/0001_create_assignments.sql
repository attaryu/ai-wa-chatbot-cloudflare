-- Migration untuk membuat tabel assignments
CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  namaMataKuliah TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  participant TEXT NOT NULL,
  deadline TEXT
);

-- Index untuk pencarian berdasarkan namaMataKuliah
CREATE INDEX IF NOT EXISTS idx_namaMataKuliah ON assignments(namaMataKuliah);

-- Index untuk sorting berdasarkan createdAt
CREATE INDEX IF NOT EXISTS idx_createdAt ON assignments(createdAt);
