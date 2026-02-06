# PANDUAN MENAMPILKAN DATA DENGAN MULUS

Bro, kalau aplikasi masih ga bisa baca Excel yang sekarang (karena formatnya rumit banget), ikutin langkah ini. Dijamin 100% jalan.

## 1. Buat Sheet Baru di Excel
Buka file `datarekap.xlsx` kamu, bikin sheet baru namanya **"REKAP_FINAL"**.

## 2. Copy-paste Data sebagai VALUES
Copy data dari sheet tahunan, tapi paste-nya pilih **Paste Special -> Values** (biar rumus hilang).

## 3. Susun Format Kolom (Baris 1 Judul, Baris 2 Data)
Pastikan urutan kolomnya sesimpel ini:

| TAHUN | DAERAH | PAJAK (Anggaran) | PAJAK (Realisasi) | RETRIBUSI (Anggaran) | RETRIBUSI (Realisasi) |
| :-- | :-- | :-- | :-- | :-- | :-- |
| 2021 | Prov. Banten | 1000000 | 950000 | 50000 | 45000 |
| 2022 | Prov. Banten | ... | ... | ... | ... |

*(Lanjutkan kolom untuk Pengelolaan Kekayaan dan Lain PAD)*

## 4. Save dan Replace
Save file itu, lalu replace file `assets/datarekap.xlsx` di project ini.

## 5. Clean Install
1. Uninstall aplikasi dari HP.
2. Run `flutter clean`.
3. Run `flutter run`.

Kalau pake cara ini, aplikasi gak perlu mikir keras buat nebak-nebak posisi header/kolom yang geser-geser.
