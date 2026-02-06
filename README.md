# Rekap Realisasi PAD App

Aplikasi Flutter untuk menampilkan rekap data realisasi PAD dari file Excel.

## Fitur
- Import file `.xlsx` / `.xls`.
- Dashboard dengan Summary Card (Total Target, Realisasi, %).
- Grafik batang capaian per wilayah.
- List detail data.

## Format Excel yang Dibutuhkan
Aplikasi ini berekspektasi file Excel dengan kolom-kolom berikut (urutan penting):

| Kolom Indeks | Isi Data | Tipe Data |
|--------------|----------|-----------|
| 1 (A)        | Wilayah  | Text      |
| 2 (B)        | Tahun    | Angka     |
| 3 (C)        | Target   | Angka     |
| 4 (D)        | Realisasi| Angka     |

Baris pertama dianggap sebagai Header dan akan dilewati.

## Cara Menjalankan
1. Pastikan Flutter terinstall.
2. Jalankan perintah:
   ```bash
   flutter pub get
   flutter run
   ```
