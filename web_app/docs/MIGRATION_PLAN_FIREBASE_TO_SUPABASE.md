# 🚀 MIGRATION PLAN: Firebase → Supabase + Backend API

> **Tanggal**: 18 Februari 2026  
> **Project**: Rekap Realisasi PAD Wilayah Jawa 2021-2025  
> **Tujuan**: Migrasi dari Firebase ke Supabase, tambah Backend API, pisah folder Web & App

---

## 📋 OVERVIEW ARSITEKTUR BARU

```
📁 Rekap PAD Project (Root)
│
├── 📁 backend/          ← NEW: Express.js/Node.js Backend API
│   ├── src/
│   │   ├── routes/      (API endpoints)
│   │   ├── controllers/ (business logic)
│   │   ├── middleware/  (auth, validation)
│   │   └── config/      (supabase client)
│   ├── package.json
│   └── .env
│
├── 📁 web_portal/       ← EXISTING: React Web (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── services/    (API calls ke backend)
│   │   └── ...
│   └── package.json
│
├── 📁 mobile_app/       ← EXISTING: Flutter App (dipindah dari root)
│   ├── lib/
│   │   ├── models/
│   │   ├── services/    (API calls ke backend)
│   │   ├── screens/
│   │   └── main.dart
│   ├── pubspec.yaml
│   └── ...
│
├── 📁 scripts/          ← Migration scripts
│   ├── migrate_firebase_to_supabase.py
│   └── ...
│
└── 📁 docs/             ← Documentation
```

### Flow Data Baru:
```
[Flutter App] ──→ [Backend API] ──→ [Supabase PostgreSQL]
[Web Portal]  ──→ [Backend API] ──→ [Supabase PostgreSQL]
                       ↕
                 [Supabase Auth]
```

---

## 📦 PHASE 0: PERSIAPAN (Estimasi: 30 menit)

### Step 0.1: Backup Semua Data Firebase
```bash
# Export data dari Firestore ke JSON (pakai script Python)
pip install firebase-admin
python scripts/export_firestore_data.py
```

> ⚠️ **PENTING**: Pastikan kamu punya backup lengkap sebelum mulai migrasi!

### Step 0.2: Buat Akun & Project Supabase
1. Buka https://supabase.com → **Start your project** (Gratis!)
2. Sign up / Login
3. Klik **"New Project"**
   - **Organization**: Pilih atau buat baru
   - **Project Name**: `rekap-pad`
   - **Database Password**: *(buat password kuat, CATAT!)*
   - **Region**: `Southeast Asia (Singapore)` ← paling dekat ke Indonesia
4. Tunggu ~2 menit sampai project ready
5. **Catat informasi berikut** (dari Settings → API):
   - `Project URL` → contoh: `https://xxxx.supabase.co`
   - `anon/public key` → untuk client-side
   - `service_role key` → untuk backend (RAHASIA!)

### Step 0.3: Install Tools yang Dibutuhkan
```bash
# Node.js (sudah punya? harusnya sudah karena pakai Vite)
node -v    # pastikan v18+
npm -v

# Supabase CLI (optional, tapi sangat berguna)
npm install -g supabase
```

---

## 📦 PHASE 1: SETUP DATABASE SUPABASE (Estimasi: 1 jam)

### Step 1.1: Buat Tabel `pad_data` di Supabase

Buka **Supabase Dashboard → SQL Editor** → Jalankan query berikut:

```sql
-- ====================================
-- TABLE: pad_data (Data PAD per daerah per tahun)
-- ====================================
CREATE TABLE pad_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tahun INTEGER NOT NULL,
  nomor_urut VARCHAR(10) DEFAULT '',
  daerah VARCHAR(255) NOT NULL,
  pajak_anggaran DOUBLE PRECISION DEFAULT 0,
  pajak_realisasi DOUBLE PRECISION DEFAULT 0,
  retribusi_anggaran DOUBLE PRECISION DEFAULT 0,
  retribusi_realisasi DOUBLE PRECISION DEFAULT 0,
  pengelolaan_anggaran DOUBLE PRECISION DEFAULT 0,
  pengelolaan_realisasi DOUBLE PRECISION DEFAULT 0,
  lain_pad_anggaran DOUBLE PRECISION DEFAULT 0,
  lain_pad_realisasi DOUBLE PRECISION DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk query cepat
CREATE INDEX idx_pad_data_tahun ON pad_data(tahun);
CREATE INDEX idx_pad_data_daerah ON pad_data(daerah);
CREATE INDEX idx_pad_data_tahun_daerah ON pad_data(tahun, daerah);

-- Trigger auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pad_data_updated_at
  BEFORE UPDATE ON pad_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Komentar tabel
COMMENT ON TABLE pad_data IS 'Data Pendapatan Asli Daerah per wilayah per tahun';
COMMENT ON COLUMN pad_data.tahun IS 'Tahun anggaran (2021-2025)';
COMMENT ON COLUMN pad_data.daerah IS 'Nama daerah (contoh: Prov. DKI Jakarta, Kab. Bogor)';
```

### Step 1.2: Buat Tabel `users` (Profiles)

```sql
-- ====================================
-- TABLE: profiles (Extended user data)
-- ====================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255),
  display_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'viewer', -- 'admin', 'editor', 'viewer'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: Auto-create profile saat user register
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### Step 1.3: Setup Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE pad_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- PAD Data Policies
-- Everyone can read (public dashboard)
CREATE POLICY "pad_data_read_all" ON pad_data
  FOR SELECT USING (true);

-- Only authenticated users can insert
CREATE POLICY "pad_data_insert_auth" ON pad_data
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can update
CREATE POLICY "pad_data_update_auth" ON pad_data
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Only authenticated users can delete
CREATE POLICY "pad_data_delete_auth" ON pad_data
  FOR DELETE USING (auth.role() = 'authenticated');

-- Profile Policies
CREATE POLICY "profiles_read_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### Step 1.4: Setup Authentication Providers

1. **Supabase Dashboard → Authentication → Providers**
2. Enable **Email** (sudah default ON)
3. Enable **Google OAuth**:
   - Buka Google Cloud Console → APIs & Services → Credentials
   - Buat OAuth 2.0 Client ID (Web Application)
   - **Authorized redirect URI**: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
   - Copy Client ID & Secret ke Supabase Dashboard

---

## 📦 PHASE 2: MIGRASI DATA (Estimasi: 30 menit)

### Step 2.1: Export Data dari Firebase

Buat script baru `scripts/export_firestore_data.py`:

```python
"""
Export all data from Firebase Firestore to JSON
"""
import firebase_admin
from firebase_admin import credentials, firestore
import json
from pathlib import Path

def export_data():
    print("📤 Exporting data from Firebase Firestore...")
    
    base_dir = Path(__file__).parent.parent
    service_account = base_dir / "firebase_service_account.json"
    output_file = base_dir / "scripts" / "firebase_export.json"
    
    # Initialize Firebase
    cred = credentials.Certificate(str(service_account))
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    
    # Export pad_data collection
    docs = db.collection('pad_data').stream()
    data = []
    
    for doc in docs:
        record = doc.to_dict()
        record['firebase_id'] = doc.id
        data.append(record)
    
    # Save to JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Exported {len(data)} records to {output_file}")

if __name__ == "__main__":
    export_data()
```

### Step 2.2: Import Data ke Supabase

Buat script `scripts/import_to_supabase.py`:

```python
"""
Import exported Firebase data to Supabase PostgreSQL
"""
import json
from pathlib import Path
from supabase import create_client, Client

# ⚠️ Ganti dengan credentials Supabase kamu!
SUPABASE_URL = "https://xxxx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGci..."  # service_role key (bukan anon key!)

def import_data():
    print("📥 Importing data to Supabase...")
    
    base_dir = Path(__file__).parent.parent
    input_file = base_dir / "scripts" / "firebase_export.json"
    
    # Load exported data
    with open(input_file, 'r', encoding='utf-8') as f:
        firebase_data = json.load(f)
    
    print(f"   Loaded {len(firebase_data)} records from export")
    
    # Initialize Supabase
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Transform data (Firebase camelCase → Supabase snake_case)
    records = []
    for item in firebase_data:
        records.append({
            'tahun': item.get('tahun', 0),
            'nomor_urut': item.get('nomorUrut', ''),
            'daerah': item.get('daerah', ''),
            'pajak_anggaran': item.get('pajakAnggaran', 0.0),
            'pajak_realisasi': item.get('pajakRealisasi', 0.0),
            'retribusi_anggaran': item.get('retribusiAnggaran', 0.0),
            'retribusi_realisasi': item.get('retribusiRealisasi', 0.0),
            'pengelolaan_anggaran': item.get('pengelolaanAnggaran', 0.0),
            'pengelolaan_realisasi': item.get('pengelolaanRealisasi', 0.0),
            'lain_pad_anggaran': item.get('lainPadAnggaran', 0.0),
            'lain_pad_realisasi': item.get('lainPadRealisasi', 0.0),
        })
    
    # Batch insert (Supabase supports bulk insert)
    batch_size = 500
    total_imported = 0
    
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        result = supabase.table('pad_data').insert(batch).execute()
        total_imported += len(batch)
        print(f"   ✓ Imported {total_imported} / {len(records)}")
    
    print(f"\n✅ Import complete! {total_imported} records in Supabase")

if __name__ == "__main__":
    import_data()
```

### Step 2.3: Verifikasi Data

```sql
-- Jalankan di Supabase SQL Editor untuk verifikasi
SELECT tahun, COUNT(*) as jumlah_record 
FROM pad_data 
GROUP BY tahun 
ORDER BY tahun;

-- Contoh query
SELECT daerah, pajak_realisasi 
FROM pad_data 
WHERE tahun = 2024 
ORDER BY pajak_realisasi DESC 
LIMIT 10;
```

---

## 📦 PHASE 3: BUAT BACKEND API (Estimasi: 2-3 jam)

### Step 3.1: Inisialisasi Project Backend

```bash
# Dari root project
mkdir backend
cd backend

# Inisialisasi Node.js project
npm init -y

# Install dependencies
npm install express cors dotenv @supabase/supabase-js helmet morgan
npm install -D nodemon
```

### Step 3.2: Struktur Folder Backend

```
backend/
├── src/
│   ├── config/
│   │   └── supabase.js        ← Supabase client config
│   ├── routes/
│   │   ├── padDataRoutes.js   ← CRUD endpoints pad_data
│   │   ├── authRoutes.js      ← Login/Register/Logout
│   │   └── statsRoutes.js     ← Statistik & analisis
│   ├── controllers/
│   │   ├── padDataController.js
│   │   ├── authController.js
│   │   └── statsController.js
│   ├── middleware/
│   │   ├── authMiddleware.js  ← Verify JWT token
│   │   └── errorHandler.js
│   └── app.js                 ← Express app setup
├── .env                        ← Environment variables
├── .env.example
├── package.json
└── server.js                   ← Entry point
```

### Step 3.3: File-file Backend Utama

**`.env`** (JANGAN commit ke Git!):
```env
PORT=3001
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NODE_ENV=development

# CORS Origins
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

**`src/config/supabase.js`**:
```javascript
const { createClient } = require('@supabase/supabase-js');

// Admin client (untuk server-side operations)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Public client (untuk client-side proxy operations)
const supabasePublic = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = { supabaseAdmin, supabasePublic };
```

**`src/app.js`**:
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const padDataRoutes = require('./routes/padDataRoutes');
const authRoutes = require('./routes/authRoutes');
const statsRoutes = require('./routes/statsRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/pad-data', padDataRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

module.exports = app;
```

**`server.js`**:
```javascript
require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Backend API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
```

### Step 3.4: API Endpoints (Routes & Controllers)

**`src/routes/padDataRoutes.js`**:
```javascript
const express = require('express');
const router = express.Router();
const controller = require('../controllers/padDataController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');

// Public routes (read)
router.get('/', controller.getAll);              // GET /api/pad-data?tahun=2024&daerah=Jakarta
router.get('/years', controller.getYears);        // GET /api/pad-data/years
router.get('/daerah', controller.getDaerahList);   // GET /api/pad-data/daerah
router.get('/grouped', controller.getGrouped);     // GET /api/pad-data/grouped
router.get('/:id', controller.getById);           // GET /api/pad-data/:id

// Protected routes (write - requires auth)
router.post('/', authMiddleware, controller.create);          // POST /api/pad-data
router.put('/:id', authMiddleware, controller.update);        // PUT /api/pad-data/:id
router.delete('/:id', authMiddleware, controller.delete);     // DELETE /api/pad-data/:id
router.post('/batch', authMiddleware, controller.batchImport); // POST /api/pad-data/batch

module.exports = router;
```

**`src/controllers/padDataController.js`**:
```javascript
const { supabaseAdmin } = require('../config/supabase');

// GET all data (with filters)
exports.getAll = async (req, res) => {
  try {
    const { tahun, daerah, page = 1, limit = 100 } = req.query;
    
    let query = supabaseAdmin
      .from('pad_data')
      .select('*', { count: 'exact' });
    
    if (tahun) query = query.eq('tahun', parseInt(tahun));
    if (daerah) query = query.ilike('daerah', `%${daerah}%`);
    
    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
    query = query.order('tahun', { ascending: true })
                 .order('daerah', { ascending: true });
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET by ID
exports.getById = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('pad_data')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET available years
exports.getYears = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('pad_data')
      .select('tahun')
      .order('tahun');
    
    if (error) throw error;
    
    const years = [...new Set(data.map(d => d.tahun))];
    res.json({ success: true, data: years });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET daerah list
exports.getDaerahList = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('pad_data')
      .select('daerah')
      .order('daerah');
    
    if (error) throw error;
    
    const daerahList = [...new Set(data.map(d => d.daerah))];
    res.json({ success: true, data: daerahList });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET grouped by daerah
exports.getGrouped = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('pad_data')
      .select('*')
      .order('daerah')
      .order('tahun');
    
    if (error) throw error;
    
    // Group by daerah
    const grouped = {};
    data.forEach(item => {
      if (!grouped[item.daerah]) {
        grouped[item.daerah] = [];
      }
      grouped[item.daerah].push(item);
    });
    
    res.json({ success: true, data: grouped });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST create
exports.create = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('pad_data')
      .insert(req.body)
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT update
exports.update = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('pad_data')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE
exports.delete = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('pad_data')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST batch import
exports.batchImport = async (req, res) => {
  try {
    const { records } = req.body;
    
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, error: 'records array required' });
    }
    
    const { data, error } = await supabaseAdmin
      .from('pad_data')
      .insert(records)
      .select();
    
    if (error) throw error;
    
    res.status(201).json({
      success: true,
      data,
      imported: data.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

**`src/middleware/authMiddleware.js`**:
```javascript
const { supabaseAdmin } = require('../config/supabase');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token tidak ditemukan. Silakan login.' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify JWT with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token tidak valid atau sudah expired.' 
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Authentication failed' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      req.user = user;
    }
  } catch (e) {
    // Silently fail - auth is optional
  }
  next();
};

module.exports = { authMiddleware, optionalAuth };
```

**`src/middleware/errorHandler.js`**:
```javascript
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
};

module.exports = errorHandler;
```

**`src/routes/authRoutes.js`**:
```javascript
const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/login', controller.login);
router.post('/register', controller.register);
router.post('/logout', controller.logout);
router.get('/me', authMiddleware, controller.getMe);

module.exports = router;
```

**`src/controllers/authController.js`**:
```javascript
const { supabaseAdmin } = require('../config/supabase');
const { createClient } = require('@supabase/supabase-js');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Buat client baru untuk auth (tidak pakai admin)
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    res.json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, error: error.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: displayName || email.split('@')[0],
        }
      }
    });
    
    if (error) throw error;
    
    res.status(201).json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out' });
};

exports.getMe = async (req, res) => {
  try {
    // Get profile from profiles table
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();
    
    res.json({
      success: true,
      data: {
        ...req.user,
        profile: data,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

**`src/routes/statsRoutes.js`**:
```javascript
const express = require('express');
const router = express.Router();
const controller = require('../controllers/statsController');

router.get('/', controller.getOverview);
router.get('/by-year/:tahun', controller.getByYear);

module.exports = router;
```

**`src/controllers/statsController.js`**:
```javascript
const { supabaseAdmin } = require('../config/supabase');

exports.getOverview = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('pad_data')
      .select('*');
    
    if (error) throw error;
    
    // Calculate statistics
    const years = [...new Set(data.map(d => d.tahun))].sort();
    const totalRecords = data.length;
    const totalDaerah = [...new Set(data.map(d => d.daerah))].length;
    
    const statsByYear = {};
    years.forEach(year => {
      const yearData = data.filter(d => d.tahun === year);
      statsByYear[year] = {
        totalRecords: yearData.length,
        totalPajakAnggaran: yearData.reduce((sum, d) => sum + (d.pajak_anggaran || 0), 0),
        totalPajakRealisasi: yearData.reduce((sum, d) => sum + (d.pajak_realisasi || 0), 0),
        totalRetribusiAnggaran: yearData.reduce((sum, d) => sum + (d.retribusi_anggaran || 0), 0),
        totalRetribusiRealisasi: yearData.reduce((sum, d) => sum + (d.retribusi_realisasi || 0), 0),
        totalPengelolaanAnggaran: yearData.reduce((sum, d) => sum + (d.pengelolaan_anggaran || 0), 0),
        totalPengelolaanRealisasi: yearData.reduce((sum, d) => sum + (d.pengelolaan_realisasi || 0), 0),
        totalLainAnggaran: yearData.reduce((sum, d) => sum + (d.lain_pad_anggaran || 0), 0),
        totalLainRealisasi: yearData.reduce((sum, d) => sum + (d.lain_pad_realisasi || 0), 0),
      };
    });
    
    res.json({
      success: true,
      data: {
        years,
        totalRecords,
        totalDaerah,
        statsByYear,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getByYear = async (req, res) => {
  try {
    const tahun = parseInt(req.params.tahun);
    
    const { data, error } = await supabaseAdmin
      .from('pad_data')
      .select('*')
      .eq('tahun', tahun)
      .order('daerah');
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

### Step 3.5: Update `package.json` Scripts

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"No tests yet\""
  }
}
```

### Step 3.6: Test Backend

```bash
cd backend
npm run dev

# Test di browser atau Postman:
# GET http://localhost:3001/api/health
# GET http://localhost:3001/api/pad-data?tahun=2024
# GET http://localhost:3001/api/pad-data/years
# GET http://localhost:3001/api/stats
```

---

## 📦 PHASE 4: UPDATE WEB PORTAL (Estimasi: 1-2 jam)

### Step 4.1: Buat API Service di Web Portal

Buat file `web_portal/src/services/api.js`:

```javascript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // PAD Data
  async getPadData(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/pad-data${query ? '?' + query : ''}`);
  }

  async getPadDataById(id) {
    return this.request(`/pad-data/${id}`);
  }

  async getYears() {
    return this.request('/pad-data/years');
  }

  async getDaerahList() {
    return this.request('/pad-data/daerah');
  }

  async getGroupedData() {
    return this.request('/pad-data/grouped');
  }

  async createPadData(data) {
    return this.request('/pad-data', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePadData(id, data) {
    return this.request(`/pad-data/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePadData(id) {
    return this.request(`/pad-data/${id}`, {
      method: 'DELETE',
    });
  }

  // Auth
  async login(email, password) {
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (result.data?.session?.access_token) {
      this.setToken(result.data.session.access_token);
    }
    return result;
  }

  async register(email, password, displayName) {
    const result = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
    if (result.data?.session?.access_token) {
      this.setToken(result.data.session.access_token);
    }
    return result;
  }

  logout() {
    this.setToken(null);
  }

  // Stats
  async getStats() {
    return this.request('/stats');
  }

  async getStatsByYear(tahun) {
    return this.request(`/stats/by-year/${tahun}`);
  }
}

export const api = new ApiService();
export default api;
```

### Step 4.2: Update Web Portal Environment

Tambah file `web_portal/.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

### Step 4.3: Update Komponen Web Portal

Ganti semua Firebase imports di `App.jsx` dan komponen lainnya:

**SEBELUM** (Firebase):
```javascript
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
// ...
const q = query(collection(db, 'pad_data'), where('tahun', '==', 2024));
const snapshot = await getDocs(q);
const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

**SESUDAH** (API Backend):
```javascript
import api from './services/api';
// ...
const result = await api.getPadData({ tahun: 2024 });
const data = result.data;
```

### Step 4.4: Hapus Firebase Dependencies dari Web Portal

```bash
cd web_portal
npm uninstall firebase
# Hapus file firebase.js
```

---

## 📦 PHASE 5: UPDATE FLUTTER APP (Estimasi: 2-3 jam)

### Step 5.1: Pindahkan Flutter Files ke Folder `mobile_app/`

```bash
# Dari root project, buat folder baru
mkdir mobile_app

# Pindahkan file Flutter ke mobile_app
# (Kolom-kolom yang dipindah):
# - lib/
# - android/
# - ios/
# - windows/
# - web/
# - linux/
# - macos/
# - test/
# - assets/
# - pubspec.yaml
# - pubspec.lock
# - analysis_options.yaml
# - .metadata
# Dll
```

> ⚠️ **Tips**: Lebih mudah buat Flutter project baru di `mobile_app/` 
> lalu pindahkan `lib/`, `assets/`, dll ke sana.

### Step 5.2: Update `pubspec.yaml` - Ganti Firebase dengan HTTP

```yaml
dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.8

  # ❌ HAPUS Firebase packages:
  # firebase_core: ^3.6.0
  # firebase_auth: ^5.3.1
  # cloud_firestore: ^5.4.4
  # google_sign_in: ^6.2.1

  # ✅ TAMBAH HTTP client packages:
  http: ^1.2.0
  shared_preferences: ^2.3.0  # Untuk simpan token

  # Existing packages (tetap)
  excel: ^4.0.6
  file_picker: ^10.3.10
  path: ^1.9.0
  path_provider: ^2.1.5
  permission_handler: ^12.0.1
  google_fonts: ^8.0.1
  fl_chart: ^1.1.1
```

### Step 5.3: Buat API Service untuk Flutter

Buat file `mobile_app/lib/services/api_service.dart`:

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/pad_model.dart';

class ApiService {
  // Ganti dengan URL backend kamu
  static const String baseUrl = 'http://localhost:3001/api'; // Development
  // static const String baseUrl = 'https://your-backend.com/api'; // Production

  String? _token;

  // Singleton
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  // Load token dari SharedPreferences
  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
  }

  // Set token
  Future<void> setToken(String? token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    if (token != null) {
      await prefs.setString('auth_token', token);
    } else {
      await prefs.remove('auth_token');
    }
  }

  // Headers
  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (_token != null) 'Authorization': 'Bearer $_token',
  };

  // ========== PAD DATA ==========

  /// Get all PAD data (with optional filters)
  Future<List<PADData>> getAllData({int? tahun, String? daerah}) async {
    final params = <String, String>{};
    if (tahun != null) params['tahun'] = tahun.toString();
    if (daerah != null) params['daerah'] = daerah;

    final uri = Uri.parse('$baseUrl/pad-data').replace(queryParameters: params);
    final response = await http.get(uri, headers: _headers);
    final body = jsonDecode(response.body);

    if (!body['success']) throw Exception(body['error']);

    return (body['data'] as List).map((item) => PADData.fromApi(item)).toList();
  }

  /// Get available years
  Future<List<int>> getYears() async {
    final response = await http.get(
      Uri.parse('$baseUrl/pad-data/years'),
      headers: _headers,
    );
    final body = jsonDecode(response.body);
    return (body['data'] as List).map((e) => e as int).toList();
  }

  /// Get daerah list
  Future<List<String>> getDaerahList() async {
    final response = await http.get(
      Uri.parse('$baseUrl/pad-data/daerah'),
      headers: _headers,
    );
    final body = jsonDecode(response.body);
    return (body['data'] as List).map((e) => e as String).toList();
  }

  /// Create PAD data
  Future<PADData> createData(PADData data) async {
    final response = await http.post(
      Uri.parse('$baseUrl/pad-data'),
      headers: _headers,
      body: jsonEncode(data.toApi()),
    );
    final body = jsonDecode(response.body);
    if (!body['success']) throw Exception(body['error']);
    return PADData.fromApi(body['data']);
  }

  /// Update PAD data
  Future<PADData> updateData(String id, PADData data) async {
    final response = await http.put(
      Uri.parse('$baseUrl/pad-data/$id'),
      headers: _headers,
      body: jsonEncode(data.toApi()),
    );
    final body = jsonDecode(response.body);
    if (!body['success']) throw Exception(body['error']);
    return PADData.fromApi(body['data']);
  }

  /// Delete PAD data
  Future<void> deleteData(String id) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/pad-data/$id'),
      headers: _headers,
    );
    final body = jsonDecode(response.body);
    if (!body['success']) throw Exception(body['error']);
  }

  // ========== AUTH ==========

  /// Login
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    final body = jsonDecode(response.body);
    if (!body['success']) throw Exception(body['error']);

    // Save token
    final token = body['data']['session']['access_token'];
    await setToken(token);

    return body['data'];
  }

  /// Register
  Future<Map<String, dynamic>> register(
    String email, String password, {String? displayName}
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
        'displayName': displayName,
      }),
    );
    final body = jsonDecode(response.body);
    if (!body['success']) throw Exception(body['error']);

    final token = body['data']['session']['access_token'];
    await setToken(token);

    return body['data'];
  }

  /// Logout
  Future<void> logout() async {
    await setToken(null);
  }

  /// Check if logged in
  bool get isLoggedIn => _token != null;

  // ========== STATS ==========

  Future<Map<String, dynamic>> getStats() async {
    final response = await http.get(
      Uri.parse('$baseUrl/stats'),
      headers: _headers,
    );
    final body = jsonDecode(response.body);
    if (!body['success']) throw Exception(body['error']);
    return body['data'];
  }
}
```

### Step 5.4: Update PAD Model (Tambah fromApi/toApi)

Di `pad_model.dart`, tambahkan methods:

```dart
// Factory dari API response (snake_case)
factory PADData.fromApi(Map<String, dynamic> data) {
  return PADData(
    docId: data['id']?.toString(),
    daerah: data['daerah'] ?? '',
    tahun: data['tahun'] ?? 0,
    nomorUrut: data['nomor_urut'] ?? '',
    pajakAnggaran: _parseDouble(data['pajak_anggaran']),
    pajakRealisasi: _parseDouble(data['pajak_realisasi']),
    retribusiAnggaran: _parseDouble(data['retribusi_anggaran']),
    retribusiRealisasi: _parseDouble(data['retribusi_realisasi']),
    pengelolaanAnggaran: _parseDouble(data['pengelolaan_anggaran']),
    pengelolaanRealisasi: _parseDouble(data['pengelolaan_realisasi']),
    lainPadAnggaran: _parseDouble(data['lain_pad_anggaran']),
    lainPadRealisasi: _parseDouble(data['lain_pad_realisasi']),
  );
}

Map<String, dynamic> toApi() {
  return {
    'tahun': tahun,
    'nomor_urut': nomorUrut,
    'daerah': daerah,
    'pajak_anggaran': pajakAnggaran,
    'pajak_realisasi': pajakRealisasi,
    'retribusi_anggaran': retribusiAnggaran,
    'retribusi_realisasi': retribusiRealisasi,
    'pengelolaan_anggaran': pengelolaanAnggaran,
    'pengelolaan_realisasi': pengelolaanRealisasi,
    'lain_pad_anggaran': lainPadAnggaran,
    'lain_pad_realisasi': lainPadRealisasi,
  };
}
```

### Step 5.5: Hapus Firebase dari Flutter

```bash
cd mobile_app

# Hapus file Firebase
rm lib/firebase_options.dart
rm lib/services/firestore_service.dart
rm lib/services/auth_service.dart

# Update main.dart - hapus Firebase.initializeApp()
```

### Step 5.6: Update `main.dart`

```dart
import 'package:flutter/material.dart';
import 'services/api_service.dart';
// ... screens imports

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize API Service (load saved token)
  await ApiService().init();
  
  runApp(const MyApp());
}
```

---

## 📦 PHASE 6: DEPLOYMENT (Estimasi: 1 jam)

### Step 6.1: Deploy Backend ke Hosting

**Option A: Railway (Recommended - Free tier)**
1. Push backend ke GitHub
2. Buka https://railway.app
3. New Project → Deploy from GitHub → pilih repo
4. Set Environment Variables (.env values)
5. Deploy! ✅

**Option B: Render.com (Free tier)**
1. Push backend ke GitHub
2. Buka https://render.com
3. New Web Service → Connect repo
4. Set env variables
5. Deploy!

**Option C: Vercel/Netlify (Serverless)**
- Perlu adjust ke serverless functions format

### Step 6.2: Deploy Web Portal

```bash
cd web_portal
# Update .env.production
echo "VITE_API_URL=https://your-backend-url.railway.app/api" > .env.production

# Build
npm run build

# Deploy ke Vercel/Netlify/Supabase Hosting
```

### Step 6.3: Update Flutter untuk Production

Di `api_service.dart`, update `baseUrl` ke production URL:
```dart
static const String baseUrl = 'https://your-backend-url.railway.app/api';
```

---

## 📦 PHASE 7: CLEANUP (Estimasi: 30 menit)

### Step 7.1: Hapus Firebase dari Project
- Hapus `firebase_service_account.json`
- Hapus `firebase.json` (hosting config)
- Hapus `.firebaserc`
- Hapus `firebase-debug.log`
- Hapus `android/app/google-services.json`
- Update `.gitignore`

### Step 7.2: Update Documentation
- Update `README.md` dengan arsitektur baru
- Update `FIREBASE_GUIDE.md` → `SUPABASE_GUIDE.md`
- Hapus `docs/FIREBASE_SETUP.md`

### Step 7.3: Disable/Hapus Firebase Project
- (Optional) Di Firebase Console, bisa archive atau delete project

---

## ✅ CHECKLIST MIGRASI

| # | Task | Status |
|---|------|--------|
| 0.1 | Backup data Firebase | ⬜ |
| 0.2 | Buat project Supabase | ⬜ |
| 1.1 | Buat tabel `pad_data` | ⬜ |
| 1.2 | Buat tabel `profiles` | ⬜ |
| 1.3 | Setup RLS (Row Level Security) | ⬜ |
| 1.4 | Setup Auth Providers | ⬜ |
| 2.1 | Export data dari Firebase | ⬜ |
| 2.2 | Import data ke Supabase | ⬜ |
| 2.3 | Verifikasi data | ⬜ |
| 3.1 | Inisialisasi backend project | ⬜ |
| 3.2 | Buat struktur folder backend | ⬜ |
| 3.3 | Implement API endpoints | ⬜ |
| 3.4 | Test backend lokal | ⬜ |
| 4.1 | Buat API service di web portal | ⬜ |
| 4.2 | Update komponen web portal | ⬜ |
| 4.3 | Test web portal dengan backend | ⬜ |
| 5.1 | Pindahkan Flutter ke `mobile_app/` | ⬜ |
| 5.2 | Update pubspec.yaml | ⬜ |
| 5.3 | Buat API service Flutter | ⬜ |
| 5.4 | Update PAD Model | ⬜ |
| 5.5 | Hapus Firebase dari Flutter | ⬜ |
| 5.6 | Test Flutter app | ⬜ |
| 6.1 | Deploy backend | ⬜ |
| 6.2 | Deploy web portal | ⬜ |
| 6.3 | Build & release Flutter app | ⬜ |
| 7.1 | Cleanup Firebase files | ⬜ |
| 7.2 | Update documentation | ⬜ |

---

## 💡 KEUNTUNGAN SETELAH MIGRASI

| Feature | Firebase (Before) | Supabase + Backend (After) |
|---------|------------------|---------------------------|
| **Database** | Firestore (NoSQL, 1GB free) | PostgreSQL (8GB free) |
| **Storage** | 5GB free | 1GB free (tapi bisa upgrade murah) |
| **Auth** | Firebase Auth | Supabase Auth (sama fiturnya) |
| **API** | Client-to-DB langsung | Backend API (lebih secure) |
| **Query** | Terbatas (NoSQL) | Full SQL power! |
| **Hosting** | Firebase Hosting | Vercel/Railway/Render |
| **Realtime** | Firestore Realtime | Supabase Realtime (WebSocket) |
| **Scalability** | Tergantung Google pricing | Flexible (bisa self-host) |

---

## ⚠️ CATATAN PENTING

1. **Jangan hapus Firebase sebelum migrasi selesai** - pastikan semua data sudah di Supabase dan app berjalan normal.
2. **Test di lokal dulu** sebelum deploy ke production.
3. **Backup, backup, backup!** Pastikan punya backup data sebelum mulai.
4. **Naming convention**: Firebase pakai camelCase, Supabase pakai snake_case. Perhatikan mapping-nya.
5. **Environment variables**: Jangan pernah commit `.env` ke Git!

---

> **Estimasi Total Waktu**: 6-8 jam (bisa lebih cepat kalau sudah familiar)  
> **Urutan Prioritas**: Phase 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7
