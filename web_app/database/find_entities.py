import pandas as pd

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\REALISASI PENDAPATAN TA 2025.xlsx'
xl = pd.ExcelFile(path)
last_sheet = xl.sheet_names[-1]
df = pd.read_excel(path, sheet_name=last_sheet, header=None)

# Let's just print rows where Column 10 or 11 has a string
for i, row in df.iterrows():
    val10 = str(row[10]).strip().upper() if pd.notna(row[10]) else ""
    val11 = str(row[11]).strip().upper() if pd.notna(row[11]) else ""
    val1 = str(row[1]).strip().upper() if pd.notna(row[1]) else ""
    
    if "KABUPATEN" in val10 or "KOTA" in val10 or "PROVINSI" in val10:
        print(f"Row {i} Col10: {row[10]}")
    if "KABUPATEN" in val11 or "KOTA" in val11 or "PROVINSI" in val11:
        print(f"Row {i} Col11: {row[11]}")
    if "KABUPATEN" in val1 or "KOTA" in val1 or "PROVINSI" in val1:
        print(f"Row {i} Col1: {row[1]}")
