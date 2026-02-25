import pandas as pd

path = r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets\REALISASI PENDAPATAN TA 2025.xlsx'
xl = pd.ExcelFile(path)
last_sheet = xl.sheet_names[-1]
df = pd.read_excel(path, sheet_name=last_sheet, header=None)

start_row = 377
for i in range(start_row, min(start_row + 30, len(df))):
    row = df.iloc[i].tolist()
    # Filter out nan to see content
    clean_row = [(j, str(v)) for j, v in enumerate(row) if pd.notna(v)]
    print(f"Row {i}: {clean_row}")
