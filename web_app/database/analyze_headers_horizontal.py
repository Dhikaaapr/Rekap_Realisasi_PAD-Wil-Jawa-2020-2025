import pandas as pd
import sys

pd.set_option('display.max_columns', None)
pd.set_option('display.width', 1000)

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\REALISASI PENDAPATAN TA 2025.xlsx'
print(f"Reading {path}...")

try:
    # Read the file to get sheet names
    xl = pd.ExcelFile(path)
    last_sheet = xl.sheet_names[-1]
    print(f"Sheet: {last_sheet}")
    
    # Read header area
    df = pd.read_excel(path, sheet_name=last_sheet, header=None, nrows=15, usecols="A:AZ")
    
    print("\n--- Scanning Horizontal Headers (Rows 1-10) ---")
    for i in range(10):
        row_vals = []
        for j, val in enumerate(df.iloc[i]):
            if pd.notna(val):
                val_str = str(val).strip().replace('\n', ' ')
                if len(val_str) > 20: val_str = val_str[:20] + '...'
                row_vals.append(f"Col{j}:{val_str}")
        if row_vals:
            print(f"Row {i+1}: {row_vals}")

except Exception as e:
    print(f"Error: {e}")
