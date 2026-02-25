import pandas as pd
import firebase_admin
from firebase_admin import credentials, firestore
import json
import os

# --- INSTRUCTIONS ---
# 1. Download your service account key from Firebase Console
# 2. Rename it to 'serviceAccountKey.json' and put it in this folder
# 3. Put your CSV/Excel file in this folder
# 4. Update the 'file_path' variable below
# 5. Run: pip install pandas firebase-admin openpyxl
# --------------------

FILE_PATH = "data_rekap.csv"  # or .xlsx
COLLECTION_NAME = "pad_data"

def init_firebase():
    if not os.path.exists('serviceAccountKey.json'):
        print("Error: serviceAccountKey.json not found!")
        return None
    
    cred = credentials.Certificate('serviceAccountKey.json')
    firebase_admin.initialize_app(cred)
    return firestore.client()

def import_data():
    db = init_firebase()
    if not db:
        return

    print(f"Reading file: {FILE_PATH}...")
    if FILE_PATH.endswith('.csv'):
        df = pd.read_csv(FILE_PATH)
    else:
        df = pd.read_excel(FILE_PATH)

    print(f"Uploading {len(df)} records to Firestore...")
    
    batch = db.batch()
    count = 0
    
    for _, row in df.iterrows():
        # Map your columns here to match PADData model
        data = {
            "daerah": row.get("daerah", ""),
            "tahun": int(row.get("tahun", 0)),
            "nomorUrut": str(row.get("nomor_urut", "")),
            "pajakAnggaran": float(row.get("pajak_anggaran", 0)),
            "pajakRealisasi": float(row.get("pajak_realisasi", 0)),
            "retribusiAnggaran": float(row.get("retribusi_anggaran", 0)),
            "retribusiRealisasi": float(row.get("retribusi_realisasi", 0)),
            "pengelolaanAnggaran": float(row.get("pengelolaan_anggaran", 0)),
            "pengelolaanRealisasi": float(row.get("pengelolaan_realisasi", 0)),
            "lainPadAnggaran": float(row.get("lain_pad_anggaran", 0)),
            "lainPadRealisasi": float(row.get("lain_pad_realisasi", 0)),
        }
        
        doc_ref = db.collection(COLLECTION_NAME).document()
        batch.set(doc_ref, data)
        count += 1
        
        # Firestore batch limit is 500
        if count % 500 == 0:
            batch.commit()
            batch = db.batch()
            print(f"Committed {count} records...")

    batch.commit()
    print(f"Successfully imported {count} records!")

if __name__ == "__main__":
    import_data()
