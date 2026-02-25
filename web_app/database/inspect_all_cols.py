import pandas as pd

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\Database Rekap 21 Des 2025 - TA 2025 1.xlsx'
df = pd.read_excel(path, sheet_name=0, header=None, nrows=10)

# Print everything in row 4, column by column
for j in range(len(df.columns)):
    val = df.iloc[4, j]
    if pd.notna(val):
        print(f"Col {j}: {val}")
