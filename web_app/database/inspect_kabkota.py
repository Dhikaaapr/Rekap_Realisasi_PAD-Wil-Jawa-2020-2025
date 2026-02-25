import pandas as pd

# Check KABKOTA.xlsx columns to know what granular data is available
path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\KABKOTA.xlsx'
df = pd.read_excel(path, sheet_name='2024')
cols = df.columns.tolist()

out = []
out.append("KABKOTA 2024 columns:")
for i, c in enumerate(cols):
    out.append(f"  Col {i}: {c}")

out.append("")
out.append(f"Total columns: {len(cols)}")
out.append(f"Total rows: {len(df)}")
out.append("")

# Show first 3 regions
out.append("First 3 regions:")
for i, row in df.head(3).iterrows():
    out.append(f"  {row.get('Daerah', row.iloc[0])}")

# Check how many are Java
import re
JAVA_KEYWORDS = [
    'JAKARTA', 'SERIBU', 'BANDUNG', 'BOGOR', 'BEKASI', 'DEPOK', 'CIMAHI', 'TASIKMALAYA', 'CIREBON', 'SUKABUMI', 'BANJAR', 'CIANJUR', 'GARUT',
    'INDRAMAYU', 'KARAWANG', 'KUNINGAN', 'MAJALENGKA', 'PANGANDARAN', 'PURWAKARTA', 'SUBANG', 'SUMEDANG', 'CIAMIS', 'TANGERANG', 'SERANG',
    'CILEGON', 'LEBAK', 'PANDEGLANG', 'SEMARANG', 'SURAKARTA', 'SOLO', 'MAGELANG', 'PEKALONGAN', 'SALATIGA', 'TEGAL', 'BANYUMAS', 'BATANG',
    'BLORA', 'BOYOLALI', 'BREBES', 'CILACAP', 'DEMAK', 'GROBOGAN', 'JEPARA', 'KEBUMEN', 'KENDAL', 'KLATEN', 'KUDUS', 'PATI', 'PEMALANG',
    'PURBALINGGA', 'PURWOREJO', 'REMBANG', 'SRAGEN', 'SUKOHARJO', 'TEMANGGUNG', 'WONOGIRI', 'WONOSOBO', 'YOGYAKARTA', 'SLEMAN', 'BANTUL',
    'KULON PROGO', 'GUNUNG KIDUL', 'SURABAYA', 'MALANG', 'BATU', 'BLITAR', 'KEDIRI', 'MADIUN', 'MOJOKERTO', 'PASURUAN', 'PROBOLINGGO',
    'BANGKALAN', 'BANYUWANGI', 'BOJONEGORO', 'BONDOWOSO', 'GRESIK', 'JEMBER', 'JOMBANG', 'LAMONGAN', 'LUMAJANG', 'MAGETAN', 'NGANJUK',
    'NGAWI', 'PACITAN', 'PAMEKASAN', 'PONOROGO', 'SAMPANG', 'SIDOARJO', 'SITUBONDO', 'SUMENEP', 'TRENGGALEK', 'TUBAN', 'TULUNGAGUNG'
]
java_count = 0
all_regions = []
for i, row in df.iterrows():
    name = str(row.get('Daerah', row.iloc[0])).strip()
    if not name or name == 'nan' or 'TOTAL' in name.upper(): continue
    all_regions.append(name)
    name_up = name.upper()
    for k in JAVA_KEYWORDS:
        if k in name_up:
            java_count += 1
            break

out.append(f"Total regions in KABKOTA 2024: {len(all_regions)}")
out.append(f"Java regions: {java_count}")

# Also check PROVINSI 2024
df_prov = pd.read_excel(r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\PROVINSI.xlsx', sheet_name='2024')
out.append(f"\nPROVINSI 2024 columns: {len(df_prov.columns)}")
out.append(f"PROVINSI 2024 regions: {len(df_prov)}")
out.append("PROVINSI columns:")
for i, c in enumerate(df_prov.columns.tolist()):
    out.append(f"  Col {i}: {c}")

with open('kabkota_struct.py', 'w', encoding='ascii', errors='replace') as f:
    for line in out:
        f.write(line + '\n')
print("Done")
