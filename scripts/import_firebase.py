"""
Script untuk import data rekap realisasi PAD tahun 2025 ke Firebase Firestore
Usage: python import_firebase.py

Requirements:
pip install firebase-admin pandas openpyxl
"""

import json
import pandas as pd
from pathlib import Path
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

def init_firebase():
    """Initialize Firebase connection"""
    # Path ke service account key (download dari Firebase Console)
    base_dir = Path(__file__).parent.parent
    service_account_path = base_dir / "firebase-service-account.json"
    
    if not service_account_path.exists():
        print("❌ ERROR: firebase-service-account.json tidak ditemukan!")
        print("Langkah untuk mendapatkan service account key:")
        print("1. Buka Firebase Console -> Project Settings -> Service Accounts")
        print("2. Klik 'Generate new private key'")
        print("3. Simpan file sebagai 'firebase-service-account.json' di root folder project")
        return None
    
    try:
        cred = credentials.Certificate(str(service_account_path))
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("✅ Firebase initialized successfully!")
        return db
    except Exception as e:
        print(f"❌ Error initializing Firebase: {e}")
        return None


def parse_number(value):
    """Safely parse number from various formats"""
    if pd.isna(value) or value is None:
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    try:
        # Remove common formatting
        clean = str(value).replace(',', '').replace(' ', '').strip()
        return float(clean) if clean else 0.0
    except:
        return 0.0


def determine_type(daerah_name):
    """Determine if daerah is Provinsi, Kota, or Kabupaten"""
    name_lower = daerah_name.lower()
    if 'prov.' in name_lower or 'provinsi' in name_lower:
        return 'Provinsi'
    elif 'kota ' in name_lower:
        return 'Kota'
    else:
        return 'Kabupaten'


def clean_name(daerah_name):
    """Extract clean name without prefix"""
    name = daerah_name
    prefixes_to_remove = ['Prov. ', 'Kab. ', 'Kota ', 'DI ', 'DKI ']
    for prefix in prefixes_to_remove:
        if name.startswith(prefix):
            name = name[len(prefix):]
    return name


def read_csv_data(csv_path, year_filter=None):
    """Read data from clean CSV file"""
    print(f"\n📖 Reading data from: {csv_path}")
    
    df = pd.read_csv(csv_path)
    print(f"Total records in CSV: {len(df)}")
    
    # Filter by year if specified
    if year_filter:
        df = df[df['TAHUN'] == year_filter]
        print(f"Records for year {year_filter}: {len(df)}")
    
    records = []
    for _, row in df.iterrows():
        tahun = int(row['TAHUN'])
        daerah = str(row['DAERAH']).strip()
        
        record = {
            'tahun': tahun,
            'daerah': daerah,
            'namaClean': clean_name(daerah),
            'tipe': determine_type(daerah),
            'pajak': {
                'anggaran': parse_number(row.get('PAJAK_ANGGARAN', 0)),
                'realisasi': parse_number(row.get('PAJAK_REALISASI', 0)),
            },
            'retribusi': {
                'anggaran': parse_number(row.get('RETRIBUSI_ANGGARAN', 0)),
                'realisasi': parse_number(row.get('RETRIBUSI_REALISASI', 0)),
            },
            'kekayaan': {
                'anggaran': parse_number(row.get('KEKAYAAN_ANGGARAN', 0)),
                'realisasi': parse_number(row.get('KEKAYAAN_REALISASI', 0)),
            },
            'lainLain': {
                'anggaran': parse_number(row.get('LAIN_ANGGARAN', 0)),
                'realisasi': parse_number(row.get('LAIN_REALISASI', 0)),
            },
            'createdAt': datetime.now(),
            'updatedAt': datetime.now(),
        }
        
        # Calculate totals
        record['totalAnggaran'] = (
            record['pajak']['anggaran'] +
            record['retribusi']['anggaran'] +
            record['kekayaan']['anggaran'] +
            record['lainLain']['anggaran']
        )
        record['totalRealisasi'] = (
            record['pajak']['realisasi'] +
            record['retribusi']['realisasi'] +
            record['kekayaan']['realisasi'] +
            record['lainLain']['realisasi']
        )
        
        records.append(record)
    
    return records


def upload_to_firestore(db, records, collection_name='pad_data', clear_year=None):
    """Upload records to Firestore"""
    print(f"\n🔥 Uploading {len(records)} records to Firestore...")
    
    collection_ref = db.collection(collection_name)
    
    # If clear_year specified, delete existing data for that year first
    if clear_year:
        print(f"🗑️ Clearing existing data for year {clear_year}...")
        existing = collection_ref.where('tahun', '==', clear_year).stream()
        deleted = 0
        for doc in existing:
            doc.reference.delete()
            deleted += 1
        print(f"  Deleted {deleted} existing records")
    
    # Upload in batches (Firestore batch limit is 500)
    batch_size = 500
    uploaded = 0
    
    for i in range(0, len(records), batch_size):
        batch = db.batch()
        chunk = records[i:i+batch_size]
        
        for record in chunk:
            doc_ref = collection_ref.document()
            batch.set(doc_ref, record)
        
        batch.commit()
        uploaded += len(chunk)
        print(f"  Uploaded {uploaded}/{len(records)} records")
    
    print(f"✅ Successfully uploaded {uploaded} records!")
    return uploaded


def main():
    print("=" * 60)
    print("IMPORT REKAP PAD DATA TO FIREBASE")
    print("=" * 60)
    
    # Initialize Firebase
    db = init_firebase()
    if not db:
        return
    
    # Paths
    base_dir = Path(__file__).parent.parent
    csv_path = base_dir / "assets" / "datarekap_clean.csv"
    
    if not csv_path.exists():
        print(f"❌ ERROR: CSV file not found at {csv_path}")
        return
    
    # Read data for year 2025 only
    records_2025 = read_csv_data(csv_path, year_filter=2025)
    
    if not records_2025:
        print("❌ No records found for year 2025!")
        return
    
    print(f"\n📊 Summary of 2025 data:")
    print(f"  Total records: {len(records_2025)}")
    
    # Count by type
    provinsi = sum(1 for r in records_2025 if r['tipe'] == 'Provinsi')
    kabupaten = sum(1 for r in records_2025 if r['tipe'] == 'Kabupaten')
    kota = sum(1 for r in records_2025 if r['tipe'] == 'Kota')
    print(f"  Provinsi: {provinsi}")
    print(f"  Kabupaten: {kabupaten}")
    print(f"  Kota: {kota}")
    
    # Confirm upload
    print("\n" + "-" * 40)
    confirm = input("Upload data to Firebase? (y/n): ")
    
    if confirm.lower() == 'y':
        # Upload to Firestore, clearing existing 2025 data first
        upload_to_firestore(db, records_2025, clear_year=2025)
        print("\n✅ Import completed!")
    else:
        print("❌ Upload cancelled.")


def import_all_years():
    """Import all years (2021-2025) - use with caution!"""
    print("=" * 60)
    print("IMPORT ALL YEARS DATA TO FIREBASE")
    print("=" * 60)
    
    db = init_firebase()
    if not db:
        return
    
    base_dir = Path(__file__).parent.parent
    csv_path = base_dir / "assets" / "datarekap_clean.csv"
    
    if not csv_path.exists():
        print(f"❌ ERROR: CSV file not found at {csv_path}")
        return
    
    # Read all data
    records = read_csv_data(csv_path)
    
    print(f"\n📊 Summary:")
    print(f"  Total records: {len(records)}")
    
    # Count by year
    year_counts = {}
    for r in records:
        year = r['tahun']
        year_counts[year] = year_counts.get(year, 0) + 1
    
    for year in sorted(year_counts.keys()):
        print(f"  {year}: {year_counts[year]} records")
    
    print("\n⚠️  WARNING: This will DELETE all existing data and upload fresh!")
    confirm = input("Are you sure? Type 'YES' to confirm: ")
    
    if confirm == 'YES':
        # Clear all existing data
        print("\n🗑️ Clearing all existing data...")
        collection_ref = db.collection('pad_data')
        existing = collection_ref.stream()
        for doc in existing:
            doc.reference.delete()
        
        # Upload all records
        upload_to_firestore(db, records)
        print("\n✅ Full import completed!")
    else:
        print("❌ Upload cancelled.")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--all':
        import_all_years()
    else:
        main()  # Default: import 2025 only
