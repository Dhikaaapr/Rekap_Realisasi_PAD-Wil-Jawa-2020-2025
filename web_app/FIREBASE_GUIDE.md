# 🔥 FIREBASE GUIDE FOR REKAP PAD

## 📋 Prerequisite

Sebelum menjalankan aplikasi, pastikan sudah setup Firebase Project.
Lihat panduan lengkap di: `docs/FIREBASE_SETUP.md`

## 🚀 Quick Start

### 1. Setup Firebase Project
Ikuti langkah 1-4 di `docs/FIREBASE_SETUP.md` untuk membuat project dan mendapatkan `google-services.json`.

### 2. Install Dependencies
```bash
flutter pub get
```

### 3. Generate Service Account (Untuk Import Data)
1. Ke Firebase Console → Project Settings → Service Accounts
2. Generate New Private Key
3. Simpan file sebagai `firebase_service_account.json` di root project.

### 4. Import Data Awal
Jalankan script python untuk import data Excel yang sudah dibersihkan ke Firestore:

```bash
# Pastikan sudah menjalankan clean_excel.py sebelumnya
pip install firebase-admin pandas

python scripts/import_to_firestore.py
```

### 5. Run App
```bash
flutter run
```

---

## 📱 Features

1. **Dashboard Real-time**: Data otomatis update tanpa pull-to-refresh
2. **Multi-User Sync**: Input di HP A langsung muncul di HP B
3. **Offline Support**: Bisa baca data saat offline (update saat online)
4. **CRUD Lengkap**: Tambah, Edit, Hapus data langsung dari aplikasi
5. **Filter & Search**: Filter tahun dan pencarian daerah

---

## ⚠️ Common Issues

**Q: Error "google-services.json not found"**
A: Pastikan file `google-services.json` ada di folder `android/app/`.

**Q: Data tidak muncul di Dashboard?**
A: Cek koneksi internet. Cek apakah import data berhasil via script.

**Q: Cannot write data?**
A: Cek Firestore Rules di Firebase Console. Pastikan tidak diblock.
