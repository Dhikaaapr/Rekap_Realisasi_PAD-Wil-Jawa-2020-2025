import pandas as pd
import json

files = [
    r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\KABKOTA.xlsx',
    r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\PROVINSI.xlsx'
]

results = {}
for f in files:
    df = pd.read_excel(f, nrows=1)
    results[f] = df.columns.tolist()

with open('excel_columns_mapping.json', 'w') as out:
    json.dump(results, out, indent=2)

print("Columns extracted to excel_columns_mapping.json")
