
from supabase import create_client, Client
import pandas as pd

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

def analyze_sukoharjo_2024():
    print("Fetching Sukoharjo 2024 data...")
    
    # 1. Get PAD ID
    res = supabase.table('pad_data').select('*').eq('daerah', 'Kab. Sukoharjo').eq('tahun', 2024).execute()
    if not res.data:
        print("No data found for Sukoharjo 2024")
        return

    pad_data = res.data[0]
    pad_id = pad_data['id']
    print(f"PAD Data: {pad_data}")
    
    # 2. Get Details
    # We also want the names if possible, but they might not be fully populated in ref_kategori_pad for all codes
    # So we'll fetch details and try to join with ref_kategori_pad manually or use what's there
    
    det = supabase.table('detail_pad_data').select('*, ref_kategori_pad(nama)').eq('pad_data_id', pad_id).execute()
    details = det.data
    
    print(f"Total Detail Rows: {len(details)}")
    
    # Convert to DataFrame for easier analysis
    data = []
    for d in details:
        name = d['ref_kategori_pad']['nama'] if d.get('ref_kategori_pad') else 'Unknown'
        data.append({
            'code': d['kategori_kode'],
            'name': name,
            'anggaran': d['anggaran'],
            'realisasi': d['realisasi'],
            'pct': (d['realisasi'] / d['anggaran'] * 100) if d['anggaran'] > 0 else 0
        })
        
    df = pd.DataFrame(data)
    
    # Sort by code
    df = df.sort_values('code')
    
    # Analysis
    import sys
    original = sys.stdout
    with open('sukoharjo_2024_deep_dive.txt', 'w') as f:
        sys.stdout = f
        pd.set_option('display.max_rows', None)
        pd.set_option('display.max_columns', None)
        pd.set_option('display.width', 1000)
        
        print(f"Total PAD Realisasi: {pad_data.get('realisasi', 'N/A')}")
        
        print("\n=== DEBUG: ALL 4.1.0.1.0 CODES ===")
        debug_pajak = df[df['code'].str.contains('4.1.0.1.0', regex=False)]
        print(debug_pajak[['code', 'name', 'realisasi']].to_string())

        # 1. PAJAK DAERAH (4.1.0.1.0)
        print("\n=== DETAIL PAJAK DAERAH (4.1.0.1.0) ===")
        # code starts with 4.1.0.1.0 AND isn't exactly 4.1.0.1.0 (to show children)
        pajak = df[df['code'].str.startswith('4.1.0.1.0') & (df['code'] != '4.1.0.1.0')]
        pajak_active = pajak[pajak['realisasi'] > 0].sort_values('realisasi', ascending=False)
        print(pajak_active[['code', 'name', 'anggaran', 'realisasi', 'pct']].to_string())

        # 2. RETRIBUSI (4.1.0.2.0)
        print("\n=== DETAIL RETRIBUSI (4.1.0.2.0) ===")
        retribusi = df[df['code'].str.startswith('4.1.0.2.0')]
        retribusi_active = retribusi[retribusi['realisasi'] > 0].sort_values('realisasi', ascending=False)
        print(retribusi_active.head(40)[['code', 'name', 'anggaran', 'realisasi', 'pct']].to_string())

        # 3. LAIN-LAIN PAD (4.1.0.4.0)
        print("\n=== DETAIL LAIN-LAIN PAD (4.1.0.4.0) ===")
        lain = df[df['code'].str.contains('4.1.0.4.0', regex=False)]
        lain_active = lain[lain['realisasi'] > 0].sort_values('realisasi', ascending=False)
        print(lain_active.head(40)[['code', 'name', 'anggaran', 'realisasi', 'pct']].to_string())

        sys.stdout = original
    print("Deep dive saved to sukoharjo_2024_deep_dive.txt")

analyze_sukoharjo_2024()
