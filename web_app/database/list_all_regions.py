import pandas as pd

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\REALISASI PENDAPATAN TA 2025.xlsx'
xl = pd.ExcelFile(path)
last_sheet = xl.sheet_names[-1]
df = pd.read_excel(path, sheet_name=last_sheet, header=None)

keywords = ["PEMERINTAH", "PROVINSI", "KABUPATEN", "KOTA"]
regions = []

for i, row in df.iterrows():
    # Only check columns 0-15 for region names to be safe
    text = " ".join([str(v) for v in row[:15] if pd.notna(v)])
    if any(k in text.upper() for k in keywords):
        regions.append((i, text))

print(f"Total regions found: {len(regions)}")
for r in regions[:20]:
    print(f"Row {r[0]}: {r[1][:100]}")
