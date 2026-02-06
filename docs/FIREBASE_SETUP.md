# 🔥 Firebase Setup Guide - Rekap PAD App

## 📋 Overview
Setup Firebase Firestore untuk multi-user real-time sync tanpa backend server.

---

## 🚀 STEP 1: Create Firebase Project

### 1.1 Go to Firebase Console
- Buka: https://console.firebase.google.com/
- Login dengan Google Account lo

### 1.2 Create New Project
1. Klik **"Add project"** / **"Create a project"**
2. **Project name**: `Rekap PAD Jawa` (atau nama lain terserah)
3. Klik **Continue**
4. **Google Analytics**: 
   - Recommended: **Enable** (pilih default account)
   - Atau **Disable** kalo ga mau tracking
5. Klik **Create project**
6. Tunggu 30-60 detik sampai selesai
7. Klik **Continue**

✅ **Firebase project ready!**

---

## 📱 STEP 2: Add Flutter App to Firebase

### 2.1 Android App Configuration

1. Di Firebase Console, klik **Android icon** (robot)
2. **Android package name**: `com.example.rekap_pad_flutter`
   - ⚠️ **PENTING**: Harus sama dengan `applicationId` di `android/app/build.gradle`
   - Cek file: `android/app/build.gradle` → cari `applicationId`
3. **App nickname** (optional): `Rekap PAD Android`
4. **Debug signing certificate SHA-1** (optional, skip dulu)
5. Klik **Register app**

### 2.2 Download google-services.json
1. Download file **google-services.json**
2. **Simpan di**: `android/app/google-services.json`
   - ⚠️ **EXACT LOCATION**: Harus di folder `android/app/`, bukan di root!
3. Klik **Next**

### 2.3 Add Firebase SDK (Skip step ini)
⚠️ **Skip** halaman ini di Firebase Console, kita akan setup manual di Flutter.
Klik **Next** → **Continue to console**

---

## 🔧 STEP 3: Enable Firestore Database

### 3.1 Create Firestore Database
1. Di Firebase Console sidebar, klik **"Firestore Database"**
2. Klik **"Create database"**
3. **Secure rules for Cloud Firestore**:
   - Pilih: **"Start in test mode"** (untuk development)
   - ⚠️ Test mode = Public access (semua bisa read/write)
   - Nanti kita ubah jadi secure
4. Klik **Next**
5. **Cloud Firestore location**: 
   - Pilih: **asia-southeast1** (Singapore - closest to Indonesia)
   - Atau **asia-southeast2** (Jakarta) kalo available
6. Klik **Enable**
7. Tunggu ~30 detik

✅ **Firestore Database ready!**

---

## 🔒 STEP 4: Setup Firestore Security Rules (IMPORTANT!)

### 4.1 Update Rules (Production-ready)
1. Di Firestore Console, klik tab **"Rules"**
2. Replace dengan rules ini:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // PAD Data collection - Read: Anyone, Write: Authenticated users only
    match /pad_data/{document=**} {
      allow read: if true; // Public read (untuk view data)
      allow write: if request.auth != null; // Authenticated users only
    }
    
    // Users collection (optional, for future auth)
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Klik **Publish**

**Penjelasan:**
- `allow read: if true` → Semua orang bisa lihat data (good untuk public dashboard)
- `allow write: if request.auth != null` → Cuma user login yang bisa input/edit/delete
- Nanti kita implement authentication di Flutter

---

## 🔐 STEP 5: Enable Authentication (Optional tapi Recommended)

### 5.1 Enable Email/Password Auth
1. Di Firebase Console sidebar, klik **"Authentication"**
2. Klik **"Get started"**
3. Tab **"Sign-in method"**
4. Enable **"Email/Password"**
   - Toggle ON untuk "Email/Password"
   - **Email link** bisa OFF
5. Klik **Save**

### 5.2 Create First Admin User (Manual)
1. Tab **"Users"**
2. Klik **"Add user"**
3. **Email**: admin@rekappad.local (atau email lo)
4. **Password**: (buat password kuat)
5. Klik **"Add user"**

✅ **Authentication ready!**

---

## 📦 STEP 6: Get Firebase Configuration

### 6.1 Android Config (Already done)
✅ File `google-services.json` sudah di `android/app/`

### 6.2 iOS Config (Optional, kalo mau deploy ke iOS)
1. Di Firebase Console, klik **iOS icon**
2. **iOS bundle ID**: `com.example.rekapPadFlutter`
3. Download **GoogleService-Info.plist**
4. Simpan di `ios/Runner/GoogleService-Info.plist`

### 6.3 Web Config (Optional)
Skip for now, fokus Android dulu.

---

## 🎯 STEP 7: Verify Setup

### Checklist:
- [x] Firebase project created
- [x] Android app registered
- [x] `google-services.json` in `android/app/`
- [x] Firestore Database enabled (asia-southeast region)
- [x] Firestore Security Rules updated
- [x] Authentication enabled
- [x] Admin user created

✅ **All done! Firebase setup complete!**

---

## 📝 NEXT STEPS

Setelah Firebase setup done:
1. ✅ Update Flutter `pubspec.yaml` dengan Firebase packages
2. ✅ Configure Android `build.gradle` files
3. ✅ Initialize Firebase in Flutter app
4. ✅ Implement Firestore services
5. ✅ Import initial data
6. ✅ Build & test

**See:** `docs/FIREBASE_FLUTTER_INTEGRATION.md` untuk Flutter integration.

---

## 🐛 Troubleshooting

### Error: "google-services.json not found"
- Pastikan file ada di `android/app/google-services.json` (bukan di root)
- Case sensitive!

### Error: "FirebaseOptions cannot be null"
- Firebase belum di-initialize
- Check `main.dart` → `Firebase.initializeApp()`

### Error: "Permission denied" saat write data
- Check Firestore Rules
- Pastikan user sudah authenticated (kalo rule require auth)

### Firestore slow/timeout
- Check internet connection
- Check Firebase region (should be asia-southeast)

---

## 💡 Pro Tips

1. **Development**: Start dengan test mode (public access)
2. **Production**: Switch ke authenticated write rules
3. **Monitoring**: Enable Firebase Analytics untuk tracking
4. **Backup**: Firestore auto-backup, tapi bisa export manual juga
5. **Quotas**: Monitor usage di Firebase Console → Usage dashboard

---

## 📞 Important Links

- Firebase Console: https://console.firebase.google.com/
- FlutterFire Docs: https://firebase.flutter.dev/
- Firestore Docs: https://firebase.google.com/docs/firestore
- Pricing: https://firebase.google.com/pricing (Check free tier limits)

---

**Status: Ready for Flutter Integration! 🚀**
