import pandas as pd

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\Database Rekap 21 Des 2025 - TA 2025 1.xlsx'
df = pd.read_excel(path, sheet_name=0, header=None, nrows=10)

print("Row 4 raw values (0-30):")
row = df.iloc[4].tolist()
for j in range(30):
    print(f"Col {j}: {type(row[j])} - {row[j]}")
