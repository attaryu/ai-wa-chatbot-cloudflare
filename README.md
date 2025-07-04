## database

CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  namaMataKuliah TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  participant TEXT NOT NULL,
  deadline TEXT
);

## Roadmap
- [x] help command
- [x] presensi
- [x] command sederhana /pagi dan /malam
- [x] integrasikan database kv (cpet jadi dlu)
- [x] tambahkan function ai
- [x] test ai cron 
- [x] tambahkan cron 
- [x] optimalkan cron reminder
- [x] tambah function toxic check
- [x] ganti db kv dgn db 1
- [x] crud tugas dari db 1
- [x] list tugas
- [x] terapkan secret store binding
- [x] modular dev id dan group id
- [ ] ngurutin prioritas list tugas
- [ ] terapkan media penyimpanan