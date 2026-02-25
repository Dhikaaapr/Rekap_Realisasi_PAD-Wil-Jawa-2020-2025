import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
from pathlib import Path

def update_2025_data():
    print("🚀 Updating 2025 Data in Firestore")
    print("=" * 60)
    
    # Paths
    base_dir = Path(__file__).parent.parent
    csv_file = base_dir / "assets" / "datarekap_2025_clean.csv"
    service_account_file = base_dir / "firebase_service_account.json"
    
    # Check CSV file
    if not csv_file.exists():
        print(f"❌ CSV file not found: {csv_file}")
        return
    
    # Initialize Firebase
    try:
        cred = credentials.Certificate(str(service_account_file))
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("✅ Firebase connected!")
    except Exception as e:
        print(f"❌ Firebase initialization error: {e}")
        return
    
    # Load CSV
    print(f"\n📖 Reading clean CSV: {csv_file}")
    df = pd.read_csv(csv_file)
    print(f"   Total records to import: {len(df)}")
    
    # Step 1: Delete existing 2025 data
    print("\n🗑️  Deleting existing 2025 data...")
    collection_ref = db.collection('pad_data')
    docs = collection_ref.where('tahun', '==', 2025).stream()
    
    deleted_count = 0
    batch_delete = db.batch()
    for doc in docs:
        batch_delete.delete(doc.reference)
        deleted_count += 1
        if deleted_count % 400 == 0:
            batch_delete.commit()
            batch_delete = db.batch()
            
    batch_delete.commit()
    print(f"   ✅ Deleted {deleted_count} existing records.")
    
    # Step 2: Import new data
    batch_size = 400
    total_imported = 0
    
    print(f"\n💾 Importing new data (batch size: {batch_size})...")
    
    for start_idx in range(0, len(df), batch_size):
        end_idx = min(start_idx + batch_size, len(df))
        batch_df = df.iloc[start_idx:end_idx]
        
        batch = db.batch()
        for _, row in batch_df.iterrows():
            doc_data = {
                'tahun': int(row['TAHUN']),
                'nomorUrut': str(row['NOMOR_URUT']) if pd.notna(row['NOMOR_URUT']) else '',
                'daerah': str(row['DAERAH']),
                'pajakAnggaran': float(row['PAJAK_ANGGARAN']),
                'pajakRealisasi': float(row['PAJAK_REALISASI']),
                'retribusiAnggaran': float(row['RETRIBUSI_ANGGARAN']),
                'retribusiRealisasi': float(row['RETRIBUSI_REALISASI']),
                'pengelolaanAnggaran': float(row['KEKAYAAN_ANGGARAN']),
                'pengelolaanRealisasi': float(row['KEKAYAAN_REALISASI']),
                'lainPadAnggaran': float(row['LAIN_ANGGARAN']),
                'lainPadRealisasi': float(row['LAIN_REALISASI']),
            }
            
            # Using auto-generated ID
            doc_ref = collection_ref.document()
            batch.set(doc_ref, doc_data)
            
        batch.commit()
        total_imported += len(batch_df)
        print(f"   ✓ Progress: {total_imported} / {len(df)}")
    
    print(f"\n🎉 SUCCESS! 2025 data updated with {total_imported} records.")

if __name__ == "__main__":
    update_2025_data()
