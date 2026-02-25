
from supabase import create_client, Client

url = 'https://xerkytrweahuniqrnabi.supabase.co'
key = 'sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ'
supabase = create_client(url, key)

def check_budget():
    print("=== Checking Budget Data (Anggaran) for 2025 ===")
    res = supabase.table('pad_data').select('*').eq('tahun', 2025).execute()
    data = res.data
    
    if not data:
        print("No data found for 2025!")
        return

    # Hitung total anggaran yang ada di DB
    total_anggaran_all = sum((r.get('pajak_anggaran') or 0) + (r.get('retribusi_anggaran') or 0) + (r.get('pengelolaan_anggaran') or 0) + (r.get('lain_pad_anggaran') or 0) for r in data)
    print(f"Total Anggaran (Semua Record 2025): {total_anggaran_all}")

    # Cek budget khusus Kab/Kota (tanpa 'Prov.')
    kabkota_data = [r for r in data if not r['daerah'].startswith('Prov.')]
    total_anggaran_kabkota = sum((r.get('pajak_anggaran') or 0) + (r.get('retribusi_anggaran') or 0) + (r.get('pengelolaan_anggaran') or 0) + (r.get('lain_pad_anggaran') or 0) for r in kabkota_data)
    print(f"Total Anggaran (Hanya Kab/Kota 2025): {total_anggaran_kabkota}")
    
    # Cek budget khusus Provinsi
    prov_data = [r for r in data if r['daerah'].startswith('Prov.')]
    total_anggaran_prov = sum((r.get('pajak_anggaran') or 0) + (r.get('retribusi_anggaran') or 0) + (r.get('pengelolaan_anggaran') or 0) + (r.get('lain_pad_anggaran') or 0) for r in prov_data)
    print(f"Total Anggaran (Hanya Provinsi 2025): {total_anggaran_prov}")

    print("\n=== Sampel Anggaran Kab/Kota (Top 5) ===")
    for r in kabkota_data[:5]:
        tot = (r.get('pajak_anggaran') or 0) + (r.get('retribusi_anggaran') or 0) + (r.get('pengelolaan_anggaran') or 0) + (r.get('lain_pad_anggaran') or 0)
        print(f"  {r['daerah']}: {tot}")

    # Cek nama kolom
    print("\n=== Column Names in DB Record ===")
    print(list(data[0].keys()))

check_budget()
