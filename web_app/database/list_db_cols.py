import pandas as pd

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\Database Rekap 21 Des 2025 - TA 2025 1.xlsx'
df = pd.read_excel(path, sheet_name=0, header=None, nrows=10)

header_row = df.iloc[7].tolist()
print("Columns in Row 8 (Header):")
for i, col in enumerate(header_row):
    if pd.notna(col):
        print(f"Col {i}: {col}")
