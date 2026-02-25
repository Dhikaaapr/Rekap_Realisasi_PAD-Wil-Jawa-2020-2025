"""
Ensure all 4 main PAD category codes exist in ref_kategori_pad.
Then run the remaining asset migration.
"""
from supabase import create_client

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
sb = create_client(url, key)

# Main PAD categories that MUST exist
required = [
    {"kode": "4.1.01", "nama": "Pajak Daerah", "level": 3, "kategori_utama": "pajak"},
    {"kode": "4.1.02", "nama": "Retribusi Daerah", "level": 3, "kategori_utama": "retribusi"},
    {"kode": "4.1.03", "nama": "Hasil Pengelolaan Kekayaan Daerah yang Dipisahkan", "level": 3, "kategori_utama": "pengelolaan"},
    {"kode": "4.1.04", "nama": "Lain-lain PAD yang Sah", "level": 3, "kategori_utama": "lain_pad"},
]

print("Checking/adding required reference categories...")
for cat in required:
    res = sb.table("ref_kategori_pad").select("kode,nama").eq("kode", cat["kode"]).execute()
    if res.data:
        print(f"  {cat['kode']}: EXISTS - {res.data[0]['nama']}")
    else:
        sb.table("ref_kategori_pad").upsert(cat, on_conflict="kode").execute()
        print(f"  {cat['kode']}: ADDED - {cat['nama']}")

print("\nDone! All required categories are now in ref_kategori_pad.")
