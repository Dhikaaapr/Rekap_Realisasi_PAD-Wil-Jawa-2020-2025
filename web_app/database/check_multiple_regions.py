import pandas as pd

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\REALISASI PENDAPATAN TA 2025.xlsx'
xl = pd.ExcelFile(path)
last_sheet = xl.sheet_names[-1]
df = pd.read_excel(path, sheet_name=last_sheet, header=None)

keywords = ["PEMERINTAH", "PROVINSI", "KABUPATEN", "KOTA"]
for i, row in df.iterrows():
    text = " ".join([str(v) for v in row if pd.notna(v)])
    if any(k in text.upper() for k in keywords):
        print(f"Row {i}: {text[:100]}...")
