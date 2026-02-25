import pandas as pd
import os

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\REALISASI PENDAPATAN TA 2025.xlsx'
xl = pd.ExcelFile(path)
last_sheet = xl.sheet_names[-1]
df = pd.read_excel(path, sheet_name=last_sheet, header=None)

search_keywords = ["PEMERINTAH", "PROVINSI", "KABUPATEN", "KOTA", "JAWA"]

print(f"Searching in file: {os.path.basename(path)}, Sheet: {last_sheet}")
found = False

for i, row in df.iterrows():
    row_text = " ".join([str(val) for val in row if pd.notna(val)])
    if any(keyword in row_text.upper() for keyword in search_keywords):
        print(f"Row {i}: {row_text[:200]}...")
        found = True
    if i > 500: # Don't scan too many rows
        break

if not found:
    print("No region-related keywords found in first 500 rows.")

# Also check Row 0-5 in all columns to see if there is a header
print("\nFirst 5 rows, first 10 columns:")
for i in range(min(5, len(df))):
    print(f"Row {i}: {list(df.iloc[i, :10])}")
