import pandas as pd
import sys

# Set options to display all columns
pd.set_option('display.max_columns', None)
pd.set_option('display.max_rows', None)
pd.set_option('display.width', 1000)

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\REALISASI PENDAPATAN TA 2025.xlsx'
print(f"Reading {path}...")

try:
    # Read the file to get sheet names
    xl = pd.ExcelFile(path)
    last_sheet = xl.sheet_names[-1]
    print(f"Sheet: {last_sheet}")
    
    # Read the sheet with no header initially to see the layout
    df = pd.read_excel(path, sheet_name=last_sheet, header=None)
    
    print("\n--- Rows 5-15 ---")
    # Rows are 0-indexed in pandas, so row 5 is index 4
    for i in range(4, 15):
        row_vals = []
        for j, val in enumerate(df.iloc[i]):
            if pd.notna(val):
                val_str = str(val).replace('\n', ' ')
                if len(val_str) > 30: val_str = val_str[:30] + '...'
                row_vals.append(f"{j}:{val_str}")
        if row_vals:
            print(f"Row {i+1}: {row_vals}")

except Exception as e:
    print(f"Error: {e}")
