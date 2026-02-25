import pandas as pd
import os

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\REALISASI PENDAPATAN TA 2025.xlsx'
df = pd.read_excel(path, sheet_name=-1, header=None, nrows=50)

print(f"File: {os.path.basename(path)}")
print("-" * 50)

for i, row in df.iterrows():
    contains_text = False
    row_data = []
    for j, val in enumerate(row):
        if pd.notna(val):
            val_str = str(val).strip()
            if len(val_str) >= 3 and any(c.isalpha() for c in val_str):
                contains_text = True
            row_data.append(f"[{j}]:{val_str[:50]}")
    
    if contains_text:
        print(f"Row {i}: {' | '.join(row_data)}")
    elif i < 10: # Always print first 10 rows to see even if they are empty or just numbers
        print(f"Row {i} (no long text): {' | '.join(row_data)}")
