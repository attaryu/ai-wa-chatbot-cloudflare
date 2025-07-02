-- Migration untuk membuat tabel assignments
CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  mata_kuliah TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  participant TEXT NOT NULL,
  deadline DATETIME
);


-- Index untuk pencarian berdasarkan namaMataKuliah
CREATE INDEX IF NOT EXISTS idx_namaMataKuliah ON assignments(mata_kuliah);

-- Index untuk sorting berdasarkan deadline
CREATE INDEX IF NOT EXISTS idx_createdAt ON assignments(deadline);