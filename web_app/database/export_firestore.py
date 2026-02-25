"""
📤 Export Data dari Firebase Firestore ke JSON
================================================
Script ini akan mengambil SEMUA data dari collection 'pad_data' 
di Firestore dan menyimpannya ke file JSON.

Usage:
  pip install firebase-admin
  python export_firestore.py

Output:
  - firebase_export.json (semua data mentah dari Firestore)
  - firebase_export_summary.txt (ringkasan data yang di-export)
"""

import firebase_admin
from firebase_admin import credentials, firestore
import json
from pathlib import Path
from datetime import datetime

def export_firestore_data():
    print("=" * 60)
    print("📤 FIREBASE FIRESTORE DATA EXPORT")
    print("=" * 60)
    print(f"⏰ Waktu: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # Paths
    base_dir = Path(__file__).parent
    service_account_file = base_dir / "rekap-pad-firebase-adminsdk-fbsvc-188a50085f.json"
    output_json = base_dir / "firebase_export.json"
    output_summary = base_dir / "firebase_export_summary.txt"

    # Check service account file
    if not service_account_file.exists():
        print(f"❌ Service account key tidak ditemukan: {service_account_file}")
        return

    print(f"🔑 Service Account: {service_account_file.name}")

    # Initialize Firebase
    try:
        print("🔧 Menghubungkan ke Firebase...")
        cred = credentials.Certificate(str(service_account_file))
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("✅ Terhubung ke Firebase!")
    except Exception as e:
        print(f"❌ Gagal konek ke Firebase: {e}")
        return

    # ========================================
    # Export Collection: pad_data
    # ========================================
    print()
    print("-" * 60)
    print("📦 Mengambil data dari collection 'pad_data'...")
    print("-" * 60)

    try:
        docs = db.collection('pad_data').stream()
        
        all_data = []
        for doc in docs:
            record = doc.to_dict()
            record['_firebase_doc_id'] = doc.id  # Simpan doc ID asli
            all_data.append(record)
        
        print(f"✅ Berhasil mengambil {len(all_data)} records dari 'pad_data'")
    except Exception as e:
        print(f"❌ Error mengambil data: {e}")
        return

    # ========================================
    # Export Collection: users (jika ada)
    # ========================================
    users_data = []
    try:
        print()
        print("📦 Mengambil data dari collection 'users' (jika ada)...")
        users_docs = db.collection('users').stream()
        for doc in users_docs:
            record = doc.to_dict()
            record['_firebase_doc_id'] = doc.id
            users_data.append(record)
        
        if users_data:
            print(f"✅ Berhasil mengambil {len(users_data)} records dari 'users'")
        else:
            print("ℹ️  Collection 'users' kosong atau tidak ada")
    except Exception as e:
        print(f"ℹ️  Collection 'users' tidak bisa diakses: {e}")

    # ========================================
    # Analisis data
    # ========================================
    print()
    print("-" * 60)
    print("📊 ANALISIS DATA")
    print("-" * 60)

    # Analisis per tahun
    tahun_count = {}
    daerah_set = set()
    fields_found = set()

    for record in all_data:
        tahun = record.get('tahun', 'N/A')
        daerah = record.get('daerah', 'N/A')
        
        tahun_count[tahun] = tahun_count.get(tahun, 0) + 1
        daerah_set.add(daerah)
        fields_found.update(record.keys())

    print(f"\n📋 Total Records: {len(all_data)}")
    print(f"📅 Tahun ditemukan: {sorted(tahun_count.keys())}")
    print(f"🏘️  Total Daerah unik: {len(daerah_set)}")
    print(f"📝 Fields per record: {sorted(fields_found)}")

    print(f"\n📊 Distribusi per Tahun:")
    for tahun in sorted(tahun_count.keys()):
        print(f"   {tahun}: {tahun_count[tahun]} records")

    # ========================================
    # Simpan ke JSON
    # ========================================
    print()
    print("-" * 60)
    print("💾 MENYIMPAN DATA")
    print("-" * 60)

    export_data = {
        'export_info': {
            'timestamp': datetime.now().isoformat(),
            'source': 'Firebase Firestore',
            'project': 'rekap-pad',
            'total_pad_data': len(all_data),
            'total_users': len(users_data),
        },
        'pad_data': all_data,
        'users': users_data,
    }

    # Custom JSON serializer untuk handle tipe data Firebase
    def json_serializer(obj):
        """Handle tipe data khusus dari Firestore"""
        if hasattr(obj, 'isoformat'):
            return obj.isoformat()
        if hasattr(obj, '__dict__'):
            return str(obj)
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, ensure_ascii=False, indent=2, default=json_serializer)

    file_size_mb = output_json.stat().st_size / (1024 * 1024)
    print(f"✅ Data disimpan ke: {output_json}")
    print(f"   Ukuran file: {file_size_mb:.2f} MB")

    # ========================================
    # Simpan summary
    # ========================================
    summary_lines = [
        "=" * 60,
        "FIREBASE EXPORT SUMMARY",
        "=" * 60,
        f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"Source: Firebase Firestore (rekap-pad)",
        "",
        f"Total pad_data records: {len(all_data)}",
        f"Total users records: {len(users_data)}",
        f"Total daerah unik: {len(daerah_set)}",
        "",
        "Distribusi per Tahun:",
    ]
    for tahun in sorted(tahun_count.keys()):
        summary_lines.append(f"  {tahun}: {tahun_count[tahun]} records")
    
    summary_lines.extend([
        "",
        "Fields yang ditemukan:",
        f"  {sorted(fields_found)}",
        "",
        "Daerah yang ditemukan:",
    ])
    for d in sorted(daerah_set):
        summary_lines.append(f"  - {d}")
    
    summary_lines.extend(["", "=" * 60])

    with open(output_summary, 'w', encoding='utf-8') as f:
        f.write('\n'.join(summary_lines))
    
    print(f"✅ Summary disimpan ke: {output_summary}")

    # ========================================
    # Selesai!
    # ========================================
    print()
    print("=" * 60)
    print("🎉 EXPORT SELESAI!")
    print("=" * 60)
    print()
    print("📁 File yang dihasilkan:")
    print(f"   1. {output_json.name} ({file_size_mb:.2f} MB)")
    print(f"   2. {output_summary.name}")
    print()
    print("📌 NEXT STEPS:")
    print("   1. Buat project Supabase di https://supabase.com")
    print("   2. Buat tabel 'pad_data' di Supabase (lihat Migration Plan)")
    print("   3. Jalankan script import_to_supabase.py")
    print()

if __name__ == "__main__":
    export_firestore_data()
