import pandas as pd

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\REALISASI PENDAPATAN TA 2025.xlsx'
xl = pd.ExcelFile(path)
df = pd.read_excel(path, sheet_name=-1, header=None, nrows=15)

# Look for region names in Row 0-10, sliding across columns
for i in range(10):
    row = df.iloc[i].tolist()
    # Find columns that look like region names (containing 'KAB' or 'KOTA' or 'PROV')
    for j, v in enumerate(row):
        if pd.notna(v) and any(k in str(v).upper() for k in ['KAB', 'KOTA', 'PROV']):
            print(f"Row {i} Col {j}: {v}")
