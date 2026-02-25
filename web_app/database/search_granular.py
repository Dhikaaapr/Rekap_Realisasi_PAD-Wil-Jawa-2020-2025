import pandas as pd

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\Database Rekap 21 Des 2025 - TA 2025 1.xlsx'
xl = pd.ExcelFile(path)
df = xl.parse('LRA', nrows=15, header=None)

for i in range(15):
    for j, v in enumerate(df.iloc[i]):
        if pd.notna(v) and "PKB" in str(v).upper():
            print(f"Found PKB at Row {i} Col {j}: {v}")
        if pd.notna(v) and "PAJAK" in str(v).upper():
            print(f"Found PAJAK at Row {i} Col {j}: {v}")
