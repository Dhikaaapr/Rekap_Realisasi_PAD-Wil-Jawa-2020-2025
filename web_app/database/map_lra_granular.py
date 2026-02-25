import pandas as pd

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\Database Rekap 21 Des 2025 - TA 2025 1.xlsx'
xl = pd.ExcelFile(path)
df = xl.parse('LRA', nrows=10, header=None)

print("Headers for 'LRA' sheet (Row 8) columns 15-100:")
row8 = df.iloc[7].tolist()
row7 = df.iloc[6].tolist() # Maybe more info in row 7?
row6 = df.iloc[5].tolist()

for j in range(15, 100):
    v8 = row8[j] if pd.notna(row8[j]) else ""
    v7 = row7[j] if j < len(row7) and pd.notna(row7[j]) else ""
    v6 = row6[j] if j < len(row6) and pd.notna(row6[j]) else ""
    if v8 or v7 or v6:
        print(f"Col {j}: [{v6}] - [{v7}] - [{v8}]")
