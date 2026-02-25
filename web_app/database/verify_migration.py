from supabase import create_client, Client
import pandas as pd

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase = create_client(url, key)

def check():
    with open("migration_report.txt", "w", encoding="utf-8") as f:
        f.write("MIGRATION STATUS SUMMARY\n")
        f.write("-" * 30 + "\n")
        
        years = [2021, 2022, 2023, 2024, 2025]
        
        for y in years:
            res = supabase.table('pad_data').select('id', count='exact').eq('tahun', y).execute()
            p_count = res.count
            
            res_d = supabase.table('detail_pad_data').select('id', count='exact').eq('tahun', y).execute()
            d_count = res_d.count
            
            line = f"Year {y}: Main={p_count}, Details={d_count}\n"
            print(line.strip())
            f.write(line)
        
        res_cat = supabase.table('ref_kategori_pad').select('id', count='exact').execute()
        f.write(f"\nTotal Reference Categories: {res_cat.count}\n")

if __name__ == "__main__":
    check()
