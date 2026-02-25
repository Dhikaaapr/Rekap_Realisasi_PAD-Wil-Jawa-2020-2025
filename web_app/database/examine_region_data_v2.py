import pandas as pd

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\REALISASI PENDAPATAN TA 2025.xlsx'
xl = pd.ExcelFile(path)
last_sheet = xl.sheet_names[-1]
df = pd.read_excel(path, sheet_name=last_sheet, header=None)

start_row = 377
for i in range(start_row, start_row + 40):
    if i >= len(df): break
    row = df.iloc[i]
    # Check column 6 for names
    name = row[6] if pd.notna(row[6]) else ""
    # Check column 10 for region?
    reg = row[10] if pd.notna(row[10]) else ""
    
    # Values might be in columns 7, 8, 9, 10, 11
    vals = []
    for j in range(7, 20):
        if pd.notna(row[j]):
            vals.append(f"Col{j}:{row[j]}")
    
    print(f"Row {i} | Col6: {name} | Col10: {reg} | Values: {vals}")
