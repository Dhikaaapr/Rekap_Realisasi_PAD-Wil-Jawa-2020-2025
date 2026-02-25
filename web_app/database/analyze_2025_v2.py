import pandas as pd

pd.set_option('display.max_columns', None)
pd.set_option('display.max_rows', None)
pd.set_option('display.width', 1000)

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\REALISASI PENDAPATAN TA 2025.xlsx'
print(f"Reading {path}...")

try:
    xl = pd.ExcelFile(path)
    last_sheet = xl.sheet_names[-1]
    print(f"Sheet: {last_sheet}")
    
    # Read without header
    df = pd.read_excel(path, sheet_name=last_sheet, header=None)
    
    print("\n--- Rows 0-20, Cols 0-10 ---")
    for i in range(25):
        row_str = []
        for j in range(15): # First 15 cols
            val = df.iloc[i, j]
            if pd.notna(val):
                val_s = str(val).strip().replace('\n', ' ')
                if len(val_s) > 20: val_s = val_s[:20]
                row_str.append(f"[{j}]={val_s}")
        print(f"Row {i}: {', '.join(row_str)}")
        
except Exception as e:
    print(f"Error: {e}")
