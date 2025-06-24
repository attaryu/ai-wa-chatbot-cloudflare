# 🤖 Dokumentasi Bot Commands

## 📝 **MANAJEMEN TUGAS**

### `/tambah-tugas [deskripsi]`
Menambahkan tugas baru ke database KV.

**Contoh:**
```
/tambah-tugas Beli groceries untuk minggu ini
/tambah-tugas Meeting dengan client jam 2 siang
/tambah-tugas Review code sebelum deadline
```

**Response:**
```
✅ Tugas berhasil ditambahkan!

📝 Tugas: Beli groceries untuk minggu ini
🆔 ID: abc123def456
⏰ Waktu: 25/6/2025 10:30:25
```

### `/lihat-tugas`
Menampilkan semua tugas yang tersimpan.

**Response:**
```
📋 **DAFTAR TUGAS**

1. ⏳ Beli groceries untuk minggu ini
   🆔 ID: abc123def456
   📅 25/6/2025

2. ✅ Meeting dengan client
   🆔 ID: def456ghi789
   📅 24/6/2025
```

### `/detail [task_id]`
Menampilkan detail lengkap tugas berdasarkan ID.

**Contoh:**
```
/detail abc123def456
```

**Response:**
```
📋 **DETAIL TUGAS**

📝 Tugas: Beli groceries untuk minggu ini
🆔 ID: abc123def456
📊 Status: ⏳ Belum Selesai
📅 Dibuat: 25/6/2025 10:30:25
👤 Oleh: 6285174346212@c.us
```

### `/selesai [task_id]`
Menandai tugas sebagai selesai.

**Contoh:**
```
/selesai abc123def456
```

**Response:**
```
✅ Tugas berhasil ditandai selesai!

📝 Beli groceries untuk minggu ini
```

### `/hapus [task_id]`
Menghapus tugas dari database.

**Contoh:**
```
/hapus abc123def456
```

**Response:**
```
🗑️ Tugas berhasil dihapus!

📝 Beli groceries untuk minggu ini
🆔 ID: abc123def456
```

## 👋 **SAPAAN**

### `/pagi`
Bot akan membalas dengan sapaan pagi.

**Response:**
```
selamat pagi bang, saya siap membantu anda
```

### `/malam`
Bot akan membalas dengan sapaan malam.

**Response:**
```
selamat malam bang, ada yang bisa saya bantu?
```

## 👥 **GRUP**

### `/presensi`
Mention semua member yang ada di grup.

**Response:**
```
@6285174346212 @6281234567890 @6287654321098
```

## ℹ️ **BANTUAN**

### `/help`
Menampilkan daftar semua command yang tersedia.

---

## 🔧 **Technical Notes**

- Semua command hanya bisa dijalankan oleh user dengan ID: `6285174346212@c.us`
- Data tugas disimpan di Cloudflare KV Database
- Task ID dibuat otomatis menggunakan timestamp + random string
- Semua waktu menggunakan timezone Asia/Jakarta

## 🚀 **Setup Requirements**

1. Cloudflare Worker dengan KV namespace binding: `kv-database`
2. Environment variables: `x-api-key`, `base_url`, `session`
3. WhatsApp API endpoint yang kompatibel
