import pandas as pd

pd.set_option('display.max_columns', None)
pd.set_option('display.max_rows', None)

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\REALISASI PENDAPATAN TA 2025.xlsx'
xl = pd.ExcelFile(path)
last_sheet = xl.sheet_names[-1]
df = pd.read_excel(path, sheet_name=last_sheet, header=None)

# Print Row 6-12 (Index 5-11)
for i in range(5, 12):
    print(f"\n=== Row {i+1} ===")
    row_data = df.iloc[i]
    # Print in chunks
    current_chunk = []
    for j, val in enumerate(row_data):
        if pd.notna(val):
            val_str = str(val).replace('\n', ' ')
            current_chunk.append(f"[{j}]={val_str}")
        
    # Print 5 items per line
    for k in range(0, len(current_chunk), 5):
        print("  " + " | ".join(current_chunk[k:k+5]))
