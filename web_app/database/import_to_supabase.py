"""
📥 Import Data Firebase Export ke Supabase PostgreSQL
======================================================
Script ini membaca firebase_export.json dan mengimport
semua data ke tabel pad_data di Supabase.

Usage:
  pip install supabase
  python import_to_supabase.py

Sebelum menjalankan:
  1. Pastikan sudah menjalankan create_tables.sql di Supabase SQL Editor
  2. Isi SUPABASE_URL dan SUPABASE_SERVICE_KEY di bawah
"""

import json
from pathlib import Path
from datetime import datetime

# ============================================================
# ⚠️ ISI CREDENTIALS SUPABASE KAMU DI SINI!
# ============================================================
SUPABASE_URL = "https://xerkytrweahuniqrnabi.supabase.co"
SUPABASE_SERVICE_KEY = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
# ============================================================

def import_to_supabase():
    print("=" * 60)
    print("📥 IMPORT DATA KE SUPABASE")
    print("=" * 60)
    print(f"⏰ Waktu: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # Validasi credentials
    if not SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_KEY == "":
        print("❌ ERROR: SUPABASE_SERVICE_KEY belum diisi!")
        print()
        print("📋 Cara mendapatkan service_role key:")
        print("   1. Buka Supabase Dashboard")
        print("   2. Klik ⚙️ Settings (sidebar kiri bawah)")
        print("   3. Pilih 'API' (di bawah Configuration)")
        print("   4. Copy 'service_role' key (klik Reveal)")
        print("   5. Paste ke variabel SUPABASE_SERVICE_KEY di script ini")
        print()
        return

    # Paths
    base_dir = Path(__file__).parent
    input_file = base_dir / "firebase_export.json"

    if not input_file.exists():
        print(f"❌ File tidak ditemukan: {input_file}")
        print("   Jalankan export_firestore.py terlebih dahulu!")
        return

    # Load exported data
    print("📖 Membaca firebase_export.json...")
    with open(input_file, 'r', encoding='utf-8') as f:
        export_data = json.load(f)

    firebase_records = export_data.get('pad_data', [])
    print(f"   Ditemukan {len(firebase_records)} records")

    # Initialize Supabase
    print()
    print("🔧 Menghubungkan ke Supabase...")
    try:
        from supabase import create_client, Client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("✅ Terhubung ke Supabase!")
    except ImportError:
        print("❌ Package 'supabase' belum ter-install!")
        print("   Jalankan: pip install supabase")
        return
    except Exception as e:
        print(f"❌ Gagal koneksi ke Supabase: {e}")
        return

    # Transform data: Firebase camelCase → Supabase snake_case
    print()
    print("🔄 Mengkonversi format data (camelCase → snake_case)...")
    
    records = []
    skipped = 0
    
    for item in firebase_records:
        try:
            record = {
                'tahun': int(item.get('tahun', 0)),
                'nomor_urut': str(item.get('nomorUrut', '')),
                'daerah': str(item.get('daerah', '')),
                'pajak_anggaran': float(item.get('pajakAnggaran', 0) or 0),
                'pajak_realisasi': float(item.get('pajakRealisasi', 0) or 0),
                'retribusi_anggaran': float(item.get('retribusiAnggaran', 0) or 0),
                'retribusi_realisasi': float(item.get('retribusiRealisasi', 0) or 0),
                'pengelolaan_anggaran': float(item.get('pengelolaanAnggaran', 0) or 0),
                'pengelolaan_realisasi': float(item.get('pengelolaanRealisasi', 0) or 0),
                'lain_pad_anggaran': float(item.get('lainPadAnggaran', 0) or 0),
                'lain_pad_realisasi': float(item.get('lainPadRealisasi', 0) or 0),
            }
            
            # Validasi: skip record tanpa daerah atau tahun 0
            if not record['daerah'] or record['tahun'] == 0:
                skipped += 1
                continue
                
            records.append(record)
        except Exception as e:
            print(f"   ⚠️ Skip record (error): {e}")
            skipped += 1

    print(f"   ✅ {len(records)} records siap di-import")
    if skipped > 0:
        print(f"   ⚠️ {skipped} records di-skip (data tidak valid)")

    # Import ke Supabase (batch insert)
    print()
    print("-" * 60)
    print("💾 MENGIMPORT DATA KE SUPABASE...")
    print("-" * 60)

    batch_size = 100  # Supabase PostgREST batch limit
    total_imported = 0
    errors = 0

    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (len(records) + batch_size - 1) // batch_size
        
        try:
            result = supabase.table('pad_data').insert(batch).execute()
            total_imported += len(batch)
            print(f"   ✅ Batch {batch_num}/{total_batches}: {len(batch)} records berhasil "
                  f"({total_imported}/{len(records)} total)")
        except Exception as e:
            errors += 1
            print(f"   ❌ Batch {batch_num}/{total_batches}: GAGAL - {e}")
            
            # Coba insert satu-satu untuk identifikasi record bermasalah
            print(f"      🔄 Mencoba insert satu-satu...")
            for record in batch:
                try:
                    supabase.table('pad_data').insert(record).execute()
                    total_imported += 1
                except Exception as e2:
                    print(f"      ❌ Skip: {record['daerah']} ({record['tahun']}) - {e2}")

    # Verifikasi
    print()
    print("-" * 60)
    print("📊 VERIFIKASI DATA")
    print("-" * 60)

    try:
        # Count total records
        count_result = supabase.table('pad_data').select('id', count='exact').execute()
        total_in_db = count_result.count if hasattr(count_result, 'count') else len(count_result.data)
        
        print(f"   Total records di Supabase: {total_in_db}")
        
        # Count per tahun
        for tahun in [2021, 2022, 2023, 2024, 2025]:
            year_result = supabase.table('pad_data').select('id', count='exact').eq('tahun', tahun).execute()
            year_count = year_result.count if hasattr(year_result, 'count') else len(year_result.data)
            print(f"   Tahun {tahun}: {year_count} records")
            
    except Exception as e:
        print(f"   ⚠️ Verifikasi gagal: {e}")
        print(f"   Total yang berhasil di-import: {total_imported}")

    # Summary
    print()
    print("=" * 60)
    print("🎉 IMPORT SELESAI!")
    print("=" * 60)
    print(f"   ✅ Berhasil: {total_imported} records")
    if errors > 0:
        print(f"   ❌ Error batches: {errors}")
    if skipped > 0:
        print(f"   ⚠️ Skipped: {skipped} records")
    print()
    print("📌 NEXT STEPS:")
    print("   1. Cek data di Supabase Dashboard → Table Editor → pad_data")
    print("   2. Lanjut ke Phase 3: Buat Backend API")
    print("   3. Lihat docs/MIGRATION_PLAN_FIREBASE_TO_SUPABASE.md")
    print()

if __name__ == "__main__":
    import_to_supabase()
