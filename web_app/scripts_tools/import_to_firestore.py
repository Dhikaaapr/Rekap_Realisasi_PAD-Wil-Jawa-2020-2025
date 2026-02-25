"""
Import data dari CSV ke Firebase Firestore
Usage: python import_to_firestore.py

Requirements:
pip install firebase-admin pandas
"""

import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
import json
from pathlib import Path

def import_data_to_firestore():
    """
    Import data dari datarekap_clean.csv ke Firestore
    """
    print("🔥 Firebase Firestore Data Import")
    print("=" * 60)
    
    # Paths
    base_dir = Path(__file__).parent.parent
    csv_file = base_dir / "assets" / "datarekap_clean.csv"
    service_account_file = base_dir / "firebase_service_account.json"
    
    # Check CSV file
    if not csv_file.exists():
        print(f"❌ CSV file not found: {csv_file}")
        print("   Run clean_excel.py first!")
        return
    
    # Check service account key
    if not service_account_file.exists():
        print("❌ Service account key not found!")
        print("\n📋 HOW TO GET SERVICE ACCOUNT KEY:")
        print("1. Go to Firebase Console: https://console.firebase.google.com/")
        print("2. Select your project")
        print("3. Project Settings → Service Accounts")
        print("4. Click 'Generate new private key'")
        print("5. Save as: firebase_service_account.json")
        print(f"6. Put in: {service_account_file}")
        return
    
    # Initialize Firebase
    try:
        print("\n🔧 Initializing Firebase...")
        cred = credentials.Certificate(str(service_account_file))
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("✅ Firebase connected!")
    except Exception as e:
        print(f"❌ Firebase initialization error: {e}")
        return
    
    # Load CSV
    print(f"\n📖 Reading CSV: {csv_file}")
    df = pd.read_csv(csv_file)
    print(f"   Total records: {len(df)}")
    
    # Prepare data
    collection_ref = db.collection('pad_data')
    batch_size = 500  # Firestore batch limit
    total_imported = 0
    
    print(f"\n💾 Importing to Firestore (batch size: {batch_size})...")
    
    # Process in batches
    for start_idx in range(0, len(df), batch_size):
        end_idx = min(start_idx + batch_size, len(df))
        batch = df.iloc[start_idx:end_idx]
        
        # Firestore batch
        firestore_batch = db.batch()
        
        for _, row in batch.iterrows():
            # Convert to dict and handle NaN
            doc_data = {
                'tahun': int(row['TAHUN']),
                'nomorUrut': str(row['NOMOR_URUT']) if pd.notna(row['NOMOR_URUT']) else '',
                'daerah': str(row['DAERAH']),
                'pajakAnggaran': float(row['PAJAK_ANGGARAN']) if pd.notna(row['PAJAK_ANGGARAN']) else 0.0,
                'pajakRealisasi': float(row['PAJAK_REALISASI']) if pd.notna(row['PAJAK_REALISASI']) else 0.0,
                'retribusiAnggaran': float(row['RETRIBUSI_ANGGARAN']) if pd.notna(row['RETRIBUSI_ANGGARAN']) else 0.0,
                'retribusiRealisasi': float(row['RETRIBUSI_REALISASI']) if pd.notna(row['RETRIBUSI_REALISASI']) else 0.0,
                'pengelolaanAnggaran': float(row['KEKAYAAN_ANGGARAN']) if pd.notna(row['KEKAYAAN_ANGGARAN']) else 0.0,
                'pengelolaanRealisasi': float(row['KEKAYAAN_REALISASI']) if pd.notna(row['KEKAYAAN_REALISASI']) else 0.0,
                'lainPadAnggaran': float(row['LAIN_ANGGARAN']) if pd.notna(row['LAIN_ANGGARAN']) else 0.0,
                'lainPadRealisasi': float(row['LAIN_REALISASI']) if pd.notna(row['LAIN_REALISASI']) else 0.0,
            }
            
            # Add to batch
            doc_ref = collection_ref.document()
            firestore_batch.set(doc_ref, doc_data)
        
        # Commit batch
        try:
            firestore_batch.commit()
            total_imported += len(batch)
            print(f"   ✓ Imported {total_imported} / {len(df)}")
        except Exception as e:
            print(f"   ❌ Batch error: {e}")
            break
    
    print(f"\n✅ Import complete! {total_imported} records imported to Firestore")
    print("\n📊 Verification:")
    print(f"   Collection: pad_data")
    print(f"   Records: {total_imported}")
    print("\n🎉 Done! Check Firebase Console to verify data.")

if __name__ == "__main__":
    import_data_to_firestore()
