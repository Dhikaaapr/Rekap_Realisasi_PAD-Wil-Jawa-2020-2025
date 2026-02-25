import pandas as pd

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\REALISASI PENDAPATAN TA 2025.xlsx'
xl = pd.ExcelFile(path)
df = pd.read_excel(path, sheet_name=-1, header=None)

start = 377
for i in range(start, start + 50):
    row = df.iloc[i].tolist()
    # Col 6 is names, Col 7,8,9... are values
    name = str(row[6]) if pd.notna(row[6]) else ""
    code = f"{row[0]}.{row[1]}.{row[2]}" if pd.notna(row[0]) else ""
    
    # Check for numbers in col 7/8
    val = row[7] if pd.notna(row[7]) else ""
    
    print(f"Row {i} | Code: {code} | Name: {name} | Col7: {val}")
