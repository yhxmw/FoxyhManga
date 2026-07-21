# 🌌 FoxyhManga - Clean & Fast Manga Reader Client

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2018.0.0-blue.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![API: MangaDex](https://img.shields.io/badge/API-MangaDex-orange.svg)](https://api.mangadex.org/docs/)
[![No Ads](https://img.shields.io/badge/Ads-None-green.svg)](#)

**FoxyhManga** adalah aplikasi pembaca manga (manga reader) berbasis web yang dirancang secara modern, responsif, dan bebas iklan. Proyek ini berjalan secara *full-stack* (Backend Express.js + Frontend Vanilla JS) dan terintegrasi langsung dengan server resmi **MangaDex**.

Aplikasi ini dilengkapi dengan **Image Proxy** dan **Iframe Proxy** mandiri di sisi backend. Hal ini menjamin pembaca dapat menikmati seluruh konten manga dan chapter secara langsung di dalam web kita tanpa terkena kendala CORS atau dialihkan ke situs eksternal (seperti MangaPlus, Shonen Jump, dll.).

---

## ✨ Fitur Utama

- 🔍 **Pencarian Manga Tingkat Lanjut (Advanced Search)**: Cari manga berdasarkan Judul, Status (Ongoing, Completed, dll.), Bahasa Asal (Jepang, Korea, Cina), dan Demografis Pembaca (Shounen, Seinen, Shoujo, Josei).
- 🔀 **Random Manga**: Temukan manga acak secara instan langsung dari database MangaDex.
- 📂 **Relasi Manga Terintegrasi**: Halaman detail menampilkan sekuel, prekuel, spin-off, atau adaptasi cerita lain secara otomatis.
- 🎨 **MangaDex Dark Theme**: Antarmuka gelap modern bergaya MangaDex dengan warna aksen oranye khas (`#ff6740`).
- 🛠️ **Pengaturan Reader Default**: Simpan preferensi default untuk Mode Membaca (Webtoon/Long-Strip atau Single Page), Lebar Halaman (600px - Full Width), dan Kualitas Gambar (HQ original atau Data Saver hemat kuota).
- 🛡️ **Bypass CORS & X-Frame-Options**:
  - **Image Proxy**: Memotong pemblokiran gambar eksternal (hotlinking).
  - **Iframe Proxy**: Me-render konten bab resmi (seperti MangaPlus) langsung di web kita tanpa membuka tab baru.
- 🔔 **Custom Dialog Modals**: Semua notifikasi dialog dan konfirmasi menggunakan popup custom HTML yang menyatu dengan desain web (bebas dari alert bawaan browser yang mengganggu).
- 📖 **Dokumentasi API Internal**: Dilengkapi halaman dokumentasi interaktif di `/docs`.

---

## 📁 Struktur Proyek

```text
FoxyhManga/
├── public/
│   ├── index.html              # Dashboard Utama (Popular New, Recommended, Seasonal, dll.)
│   ├── manga.html              # Halaman Detail Manga & Daftar Chapter & Seri Terkait
│   ├── reader.html             # Webtoon & Single Page Reader (Custom Popups & Embed Iframe)
│   ├── docs.html               # Dokumentasi API Internal FoxyhManga
│   ├── style.css               # Desain UI tema gelap premium
│   └── placeholder-cover.jpg   # Gambar fallback cover jika bermasalah
├── package.json                # Dependensi proyek & konfigurasi ES Modules
└── server.js                   # Node.js backend & API proxy bebas CORS
```

---

## ⚡ Cara Instalasi & Menjalankan

### Prasyarat
- [Node.js](https://nodejs.org/) versi 18.0.0 atau yang lebih baru.

### Langkah-Langkah
1. **Clone & Masuk Direktori**:
   ```bash
   git clone https://github.com/HaidarMahiru/FoxyhManga.git && cd FoxyhManga
   ```

2. **Instal Dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan Server**:
   ```bash
   npm start
   ```
   *Secara default, aplikasi akan berjalan di port `3000` (atau port `2010` jika dikonfigurasi melalui environment variable `PORT`).*

4. **Akses di Browser**:
   Buka alamat berikut di browser favorit Anda:
   - Web App: `http://localhost:3000`
   - Dokumentasi API: `http://localhost:3000/docs`

---

## 📡 API Endpoints (Backend)

Backend FoxyhManga bertindak sebagai proxy perantara bebas CORS untuk mengonsumsi data dari MangaDex. Berikut adalah beberapa endpoint yang tersedia:

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| **GET** | `/api/manga` | Mencari manga dengan filter parameter lengkap (Sort, Status, Demografis, Tag/Genre). |
| **GET** | `/api/manga/:id` | Mengambil detail info & cover untuk satu manga. |
| **GET** | `/api/manga/:id/relation` | Mengambil daftar manga terkait (sequel, prequel, dll.). |
| **GET** | `/api/manga/:id/feed` | Mengambil daftar chapter manga (mendukung filter bahasa `lang`). |
| **GET** | `/api/chapter/:id` | Mengambil daftar URL gambar halaman pembaca chapter. |
| **GET** | `/api/tags` | Mengambil daftar seluruh tag & genre resmi. |
| **GET** | `/api/manga/random/get` | Mengambil satu ID manga secara acak. |
| **GET** | `/api/proxy?url=<url>` | Proxy gambar untuk memotong pemblokiran CORS. |
| **GET** | `/api/iframe-proxy?url=<url>` | Proxy halaman eksternal agar bisa dibuka di iframe. |

*Detail parameter dan contoh request `curl` lengkap dapat diakses langsung pada halaman **`http://localhost:3000/docs`**.*

---

## 📜 Lisensi

Proyek ini dilisensikan di bawah **MIT License** - lihat file [LICENSE](LICENSE) untuk detail lebih lanjut.

---

## 🤝 Kontribusi

Kontribusi selalu terbuka! Jika Anda menemukan bug atau memiliki ide fitur baru, silakan buka **Issue** Or kirim **Pull Request** langsung di repositori ini.

Dibuat dengan dedikasi penuh oleh [FoxyhManga Team](https://github.com/HaidarMahiru). Selamat membaca! 📖✨
