# Yuka-Store

Marketplace frontend untuk mini project React Fundamentals. Aplikasi menggunakan Fake Store API untuk menampilkan katalog produk, detail produk, autentikasi demo, serta direktori pelanggan.

## Teknologi

- React 18 dan React Router
- Vite
- CSS component-oriented dengan reusable React components dan state-driven UI
- Fake Store API (`https://fakestoreapi.com`)

## Fitur

- Katalog fashion tas, baju/kemeja, hoodie/jaket, dan celana dengan pencarian, filter kategori, serta pagination client-side.
- Halaman detail produk, termasuk rating dan deskripsi.
- Form login terhubung ke `POST /auth/login`, sesi token disimpan di `localStorage`.
- Form register mengirim data ke `POST /users`.
- Daftar pelanggan dan halaman detail yang dilindungi route berbasis token.
- State loading, error dengan tombol coba lagi, dan empty state.
- Layout responsif untuk desktop dan mobile.

Katalog menggabungkan item fashion dari Fake Store API dengan produk contoh lokal untuk melengkapi kategori. Produk contoh dan harganya hanya untuk simulasi; website belum memproses transaksi.

Foto editorial dan produk contoh menggunakan gambar Unsplash, sedangkan produk API memakai foto aslinya dari Fake Store API. Gambar memerlukan koneksi internet.

## Menjalankan project

Pastikan Node.js versi 18 atau lebih baru telah terpasang.

```bash
npm install
npm run dev
```

Buka URL yang ditampilkan Vite di terminal. Untuk build production:

```bash
npm run build
npm run preview
```

### Akun demo

Gunakan akun demo aplikasi berikut:

- Username: `Andika`
- Password: `yuka99`

Fake Store API tidak memungkinkan akun demo diubah. Saat login, aplikasi menerjemahkan kredensial di atas ke akun demo API (`johnd`) agar autentikasi tetap berfungsi. API mengembalikan token simulasi. Fake Store API tidak menyediakan endpoint registrasi atau persistensi akun; form register menggunakan endpoint simulasi `POST /users`, sehingga akun yang dibuat tidak dapat dipakai untuk login dan tidak tersimpan permanen. Token disimpan di browser untuk alur protected route, sedangkan Fake Store API dapat mengabaikan header otorisasi.

## Repository

Link repository GitHub: [AndikaSaputra27/Mini-Project-Andika-N.S](https://github.com/AndikaSaputra27/Mini-Project-Andika-N.S).
