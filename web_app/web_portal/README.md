# PAD JAWA - Portal Rekapitulasi Web

Web portal untuk melihat rekapitulasi Pendapatan Asli Daerah (PAD) Wilayah Jawa 2021-2025. 
Ini adalah versi website dari aplikasi Flutter mobile "Rekap Realisasi PAD".

## Fitur Utama
- **Dashboard Eksekutif**: Ringkasan data realisasi PAD se-wilayah Jawa.
- **Clustered View**: Menampilkan 10 daerah dengan pendapatan tertinggi, lainnya, dan 10 terendah.
- **Real-time Data**: Sinkronisasi langsung dengan Firebase Firestore yang sama dengan aplikasi mobile.
- **Search & Filter**: Pencarian daerah dengan performa instan.
- **Responsive Design**: Menggunakan Tailwind CSS untuk tampilan premium di desktop maupun tablet.

## Tech Stack
- **Frontend**: React.js + Vite
- **Styling**: Tailwind CSS + Framer Motion (Animations)
- **Database**: Firebase Firestore
- **Icons**: Lucide React
- **Automation**: scripts/import_data.py (Python)

## Cara Menjalankan
1. Masuk ke folder `web_portal`
2. Jalankan `npm install` (sudah dilakukan)
3. Jalankan `npm run dev`
4. Buka `http://localhost:5173` (cek terminal untuk port yang tepat)

## Data Import (Python)
Untuk melakukan import data masal dari CSV atau Excel:
1. Pastikan Python sudah terinstal.
2. Masuk ke folder `web_portal/scripts`.
3. Jalankan `pip install pandas firebase-admin openpyxl`.
4. Letakkan file data dan `serviceAccountKey.json` dari Firebase Console.
5. Jalankan `python import_data.py`.

---
*Dibuat oleh Antigravity untuk Dhika.*
