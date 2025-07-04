## 📝 Command active
- `/presensi` - Mention semua member grup

- `/tugas [nama tugas]` - Menambah tugas baru
- `/list-tugas` - Melihat semua tugas
- `/hapus [nama tugas]` - Hapus tugas

- `/week` - sekarang minggu kuliah ke berapa

- `/dosen` - database dosen dan no WA + NIDN
- `/ai` - tanya ai

- `/help` - tanya detail command
- `/dev` - informasi terkait project chatbot

## Still development
- `/random-wheel` - mengurutkan secara acak urutan maju tiap nrp (tpi keknya gakepake)
- `/ig` - download konten dari url ig
- `/fb` - download konten dari url fb
- `/yt` - download konten dari url yt

## Feature
✅ Deploy worker gratis - Cloudflare worker
✅ Mention semua grup sehingga tidak ketinggalan informasi penting
✅ Manajemen tugas bersama dengan mudah
✅ Otomatis reminder tugas yang deadlinenya hari tersebut - cron jobs
✅ Otomatis rekap tugas tiap minggu - cron jobs
✅ Tugas otomatis terhapus setelah lewat dari deadline - cron jobs
✅ Tanya ai dari pdf yang dikirimkan - RAG
✅ Tanya ai dgn database tugas - RAG
✅ Peringatan kata kata toxic
✅ Open source project, sehingga semua bisa nambah fitur/ modifikasi sesuai keinginan
✅ Open source project, sehingga semua bisa nambah fitur/ modifikasi sesuai keinginan


## JSON Tugas

```json
[
    {
        "nama": "Data Mining",
        "deskripsi": "Membuat ringkasan materi minggu pertama",
        "tenggat": "2024-03-10T23:59:00"
    },
    {
        "nama": "Web development",
        "deskripsi": "Mengerjakan soal latihan bab 2",
        "tenggat": "2024-03-17T23:59:00"
    }
]
```