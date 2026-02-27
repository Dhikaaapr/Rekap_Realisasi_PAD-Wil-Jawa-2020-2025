from supabase import create_client, Client

url = "https://xerkytrweahuniqrnabi.supabase.co"
key = "sb_secret_gb-LDGRrOT5cyuNYKGO9gw_fsGy_zWJ"
supabase: Client = create_client(url, key)

TAHUN = 2024

# Sync kolom ringkasan pad_data dari detail_pad_data untuk semua wilayah 2024
print(f"=== SYNC pad_data ringkasan dari detail_pad_data (tahun {TAHUN}) ===")
all_2024 = supabase.table('pad_data').select('id, daerah').eq('tahun', TAHUN).execute()
print(f"Total wilayah 2024: {len(all_2024.data)}")

synced = 0
for row in all_2024.data:
    pad_id = row['id']
    daerah = row['daerah']
    
    # Fetch semua detail untuk wilayah ini
    details = supabase.table('detail_pad_data').select('kategori_kode, anggaran, realisasi').eq('pad_data_id', pad_id).execute()
    
    if not details.data:
        continue
    
    pajak_ang = pajak_rel = ret_ang = ret_rel = peng_ang = peng_rel = lain_ang = lain_rel = 0.0
    
    for det in details.data:
        kode = (det.get('kategori_kode') or '').upper()
        ang = float(det.get('anggaran') or 0)
        rel = float(det.get('realisasi') or 0)
        
        if 'PAD-PAJAK' in kode or kode.startswith('4.1.01') or kode.startswith('PAJ'):
            pajak_ang += ang
            pajak_rel += rel
        elif 'PAD-RETRIBUSI' in kode or kode.startswith('4.1.02') or kode.startswith('RET'):
            ret_ang += ang
            ret_rel += rel
        elif 'PAD-PENGELOLAAN' in kode or kode.startswith('4.1.03'):
            peng_ang += ang
            peng_rel += rel
        elif 'PAD-LAIN' in kode or kode.startswith('4.1.04'):
            lain_ang += ang
            lain_rel += rel
    
    total_rel = pajak_rel + ret_rel + peng_rel + lain_rel
    
    if total_rel > 0:
        supabase.table('pad_data').update({
            'pajak_anggaran': pajak_ang,
            'pajak_realisasi': pajak_rel,
            'retribusi_anggaran': ret_ang,
            'retribusi_realisasi': ret_rel,
            'pengelolaan_anggaran': peng_ang,
            'pengelolaan_realisasi': peng_rel,
            'lain_pad_anggaran': lain_ang,
            'lain_pad_realisasi': lain_rel,
        }).eq('id', pad_id).execute()
        synced += 1
        print(f"  Synced: {daerah} > Rp {total_rel/1e9:.1f}M")

print(f"\nTotal synced: {synced} wilayah")

# Cek hasil akhir
print("\n=== HASIL AKHIR DATA 2024 ===")
final = supabase.table('pad_data').select('daerah, pajak_realisasi, retribusi_realisasi').eq('tahun', TAHUN).order('daerah').execute()
nonzero = [d for d in final.data if (d.get('pajak_realisasi') or 0) + (d.get('retribusi_realisasi') or 0) > 0]
print(f"Total wilayah 2024     : {len(final.data)}")
print(f"Wilayah non-zero       : {len(nonzero)}")
print(f"Wilayah masih nol      : {len(final.data) - len(nonzero)}")
