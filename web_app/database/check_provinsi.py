import pandas as pd

pd.set_option('display.max_columns', None)
path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\PROVINSI.xlsx'
print(f"Reading {path}")
df = pd.read_excel(path, header=None)

# Print Row 5-15
for i in range(4, 15):
    print(f"\n=== Row {i+1} ===")
    row_data = df.iloc[i]
    chunk = []
    for j, val in enumerate(row_data):
        if pd.notna(val):
            chunk.append(f"[{j}]={str(val).replace('\n', ' ')[:30]}")
    
    for k in range(0, len(chunk), 5):
        print(" | ".join(chunk[k:k+5]))
