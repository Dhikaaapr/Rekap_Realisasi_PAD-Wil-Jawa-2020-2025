import pandas as pd
import os
from supabase import create_client, Client

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase = create_client(url, key)

def main():
    path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\Database Rekap 21 Des 2025 - TA 2025 1.xlsx'
    # Use LRA (sort) sheet
    df = pd.read_excel(path, sheet_name='LRA (sort)', header=None)
    
    # Mapping for main categories in LRA (sort)
    # Col 1: Daerah
    # Col 2,3: Pajak (Anggaran, Realisasi)
    # Col 5,6: Retribusi
    # Col 8,9: Pengelolaan
    # Col 11,12: Lain PAD
    
    mapping = {
        'PAD-PAJAK': {'ang': 2, 'real': 3},
        'PAD-RETRIBUSI': {'ang': 5, 'real': 6},
        'PAD-PENGELOLAAN': {'ang': 8, 'real': 9},
        'PAD-LAIN': {'ang': 11, 'real': 12},
    }
    
    print("Starting seed for 2025 top-level categories...")
    
    # Data starts from row 10 in LRA (sort)
    for i in range(10, len(df)):
        region_name = str(df.iloc[i, 1]).strip()
        if not region_name or region_name == 'nan': continue
        if any(x in region_name.upper() for x in ['TOTAL', 'INDONESIA']): continue
        
        print(f"Processing: {region_name}")
        
        # Get pad_data_id
        res_pad = supabase.table('pad_data').select('id').eq('tahun', 2025).eq('daerah', region_name).execute()
        
        pad_id = None
        if res_pad.data:
            pad_id = res_pad.data[0]['id']
        else:
            # Create pad_data record
            new_pad = {'tahun': 2025, 'daerah': region_name}
            res_ins = supabase.table('pad_data').insert(new_pad).execute()
            if res_ins.data:
                pad_id = res_ins.data[0]['id']
            else:
                print(f"Failed to create pad_data for {region_name}")
                continue
        
        # Prepare summary for pad_data table
        summary_update = {}
        
        # Insert/Update details
        for cat_code, cols in mapping.items():
            ang = df.iloc[i, cols['ang']] if pd.notna(df.iloc[i, cols['ang']]) else 0
            real = df.iloc[i, cols['real']] if pd.notna(df.iloc[i, cols['real']]) else 0
            
            detail = {
                'pad_data_id': pad_id,
                'tahun': 2025,
                'daerah': region_name,
                'kategori_kode': cat_code,
                'anggaran': float(ang),
                'realisasi': float(real)
            }
            
            # Map to pad_data column names
            col_map = {
                'PAD-PAJAK': 'pajak',
                'PAD-RETRIBUSI': 'retribusi',
                'PAD-PENGELOLAAN': 'pengelolaan',
                'PAD-LAIN': 'lain_pad'
            }
            prefix = col_map.get(cat_code)
            if prefix:
                summary_update[f'{prefix}_anggaran'] = float(ang)
                summary_update[f'{prefix}_realisasi'] = float(real)

            # Manual check instead of upsert to avoid constraint errors
            res_check = supabase.table('detail_pad_data').select('id').eq('pad_data_id', pad_id).eq('kategori_kode', cat_code).execute()
            
            if res_check.data:
                det_id = res_check.data[0]['id']
                supabase.table('detail_pad_data').update(detail).eq('id', det_id).execute()
            else:
                supabase.table('detail_pad_data').insert(detail).execute()
                
        # Update pad_data table with totals
        if summary_update:
            supabase.table('pad_data').update(summary_update).eq('id', pad_id).execute()

    print("Seed 2025 complete!")

main()
