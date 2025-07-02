## database

CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  namaMataKuliah TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  participant TEXT NOT NULL,
  deadline TEXT
);

