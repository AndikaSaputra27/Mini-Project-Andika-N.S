# Yuka Store

Demo toko online untuk latihan React dan backend Node.js. Data katalog, akun, stok, pesanan, kupon, dan ulasan disimpan di file JSON lokal. Tidak ada pembayaran sungguhan.

## Teknologi

- React 18, React Router, dan Vite
- API backend Node.js menggunakan modul bawaan
- Penyimpanan demo persisten di `.data/store.json` (dibuat otomatis dan tidak masuk Git)
- CSS responsif; gambar produk memerlukan koneksi internet

## Menjalankan aplikasi

Gunakan Node.js 18 atau lebih baru. Di folder proyek jalankan:

```bash
npm install
npm run dev
```

Perintah `npm run dev` menjalankan backend API dan Vite. Buka URL yang ditampilkan Vite. Untuk memeriksa production build:

```bash
npm run build
npm run preview:full
npm test
```

## Akun demo

- Admin: username `admin`, password `admin123`
- Pembeli: username `Andika`, password `yuka99`

Akun pembeli tambahan dapat dibuat melalui halaman daftar. Jangan gunakan kata sandi pribadi; akun dan data ini hanya untuk demo lokal.

## Alur demo

1. Masuk sebagai pembeli, tambahkan produk ke keranjang, isi alamat, dan gunakan kupon `YUKA10` bila diperlukan.
2. Buat pesanan lalu buka **Pesanan** dan pilih **Bayar simulasi**.
3. Masuk sebagai admin, buka **Admin → Pesanan**, verifikasi pembayaran, masukkan nomor resi, lalu ubah status pengiriman.
4. Pembeli dapat melihat status dan nomor resi di halaman **Pesanan**.
5. Pembeli dapat mengirim ulasan di halaman detail produk. Ulasan baru ditampilkan setelah disetujui admin.
6. Admin dapat mengelola produk, harga, stok, kategori, kupon, pesanan, dan ulasan.

## Batasan demo

Backend ini untuk pembelajaran lokal, bukan sistem produksi. Pembayaran disimulasikan, sesi berakhir saat backend dimulai ulang, dan penyimpanan JSON tidak ditujukan untuk banyak pengguna secara bersamaan. Jangan menghubungkan aplikasi ini ke pembayaran, data pribadi, atau penggunaan publik tanpa pengamanan, database, dan konfigurasi produksi yang sesuai.
